import validateRequest from "@/utils/validateRequest";
import validateSession from "@/utils/validateSession";
import { NextRequest } from "next/server";
import prisma from "@/utils/prismaClient";
import characterListData from "@/../lib/characters.json";
import gameManager from "@/../lib/gameManager";

export async function POST(request: NextRequest) {
    const sessionValidator = await validateSession(request.cookies.get("sessionId")?.value);

    if (sessionValidator.code !== 200) return sessionValidator.response;

    const req = await request.json();

    const isValid = (await validateRequest([ "deck", ], req)).isValid;

    if (isValid === false) {
        return new Response("Missing input fields.", {
            status: 422,
        });
    }

    // check if user is already in game
    const userInDb = await prisma.user.findUnique({
        where: {
            id: sessionValidator.userId,
        },
    });

    if (userInDb.isInGame === true) {
        return new Response("User already in game.", {
            status: 403,
        });
    }

    // await prisma.user.update({
    //     where: {
    //         id: sessionValidator.userId,
    //     },
    //     data: {
    //         isInGame: true,
    //     },
    // });

    const deckArray = JSON.parse(req.deck);

    if (deckArray?.length !== 3) {
        return new Response("Incorrect deck length.", {
            status: 422,
        });
    }

    const userCharacters = await prisma.character.findMany({
        where: {
            userId: sessionValidator.userId,
        },
    });

    if (!userCharacters || userCharacters?.length < 1) {
        return new Response("No characters found.", {
            status: 404,
        });
    }
    
    let isDeckValid: boolean = true;
    
    deckArray.forEach((character: string) => {
        const characterInList = userCharacters.find((c: any) => c.characterId === character);

        if (!characterInList) {
            isDeckValid = false;
        }
    })

    if (!isDeckValid) {
        return new Response("Invalid deck!")
    }

    const data = {
        playerId: sessionValidator.userId,
        deck: deckArray,
    };

    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    };

    const response = await fetch("http://localhost:3001/api/createGame", options);

    const res = await response.json();
    
    return new Response(JSON.stringify(res));
}