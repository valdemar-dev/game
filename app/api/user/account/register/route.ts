import { NextRequest } from "next/server";
import validateRequest from "@/utils/validateRequest";
import prisma from "@/utils/prismaClient";
import { cookies } from "next/headers";
import characterListData from "@/../lib/characters.json";

const characterList: CharacterList = characterListData;

interface Character {
    name: string;
    description: string;
    baseAttack: number;
    baseDefence: number;
    baseHealth: number;
    moves: string[];
};

interface ExtendedCharacter extends Character {
    exp: number;
    health: number;
    defence: number;
    attack: number;
    level: number;
};

interface CharacterList {
    [key: string]: Character;
}

export async function POST(request: NextRequest) {
    const req = await request.json();

    const isValid = (await validateRequest(["username", "password"], req)).isValid;

    if (isValid === false) {
        return new Response("Missing input fields.", {
            status: 422,
        });
    }

    if (
        await prisma.user.findUnique({
            where: {
                username: req.username,
            },
        }) !== null
    ) {
        return new Response("This user already exists.", {
            status: 401,
        });
    }

    const sessionId = crypto.randomUUID();

    const characterOne = characterList["00001"];
    const characterTwo = characterList["00002"];
    const characterThree = characterList["00003"];


    await prisma.user.create({
        data: {
            username: req.username,
            password: req.password,
            sessions: {
                create: [
                    {
                        id: sessionId,
                    },
                ],
            },
            characters: {
                create: [
                    {
                        characterId: "00001",
                        attack: characterOne.baseAttack,
                        defence: characterOne.baseDefence,
                        health: characterOne.baseHealth,
                        moves: characterOne.moves,
                    },
                    {
                        characterId: "00002",
                        attack: characterTwo.baseAttack,
                        defence: characterTwo.baseDefence,
                        health: characterTwo.baseHealth,
                        moves: characterTwo.moves,
                    },
                    {
                        characterId: "00003",
                        attack: characterThree.baseAttack,
                        defence: characterThree.baseDefence,
                        health: characterThree.baseHealth,
                        moves: characterThree.moves,
                    },
                ],
            },
        },
    });   

    const cookieStore = cookies();
    cookieStore.set({name: "sessionId", value: sessionId, secure: true, httpOnly: true, });

    return new Response(
        JSON.stringify({ text: "Registration complete!", })
    );
}