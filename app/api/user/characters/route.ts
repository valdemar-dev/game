import { NextRequest } from "next/server";
import validateSession from "@/utils/validateSession";
import prisma from "@/utils/prismaClient";
import fs from "fs";
import path from "path";
import characterListData from "@/../lib/characters.json";

const characterList: CharacterList = characterListData;

interface Character {
    name: string;
    description: string;
    attack: number;
    defence: number;
    moves: string[];
}

interface ExtendedCharacter extends Character {
    exp: number;
    id: string;
}

interface CharacterList {
    [key: string]: Character;
}

export async function GET(request: NextRequest) {
    const sessionValidator = await validateSession(request.cookies.get("sessionId")?.value);

    if (sessionValidator.code !== 200) return sessionValidator.response;

    const playerCharacters = await prisma.character.findMany({
        where: {
            userId: sessionValidator.userId,
        },
    });

    if (!playerCharacters || playerCharacters?.length < 1) {
        return new Response("This account hasn't unlocked any characters yet.", {
            status: 404,
        });
    }

    let characters: Character[] = [];

    playerCharacters.forEach((character: any) => {
        const characterInList: ExtendedCharacter = {
            ...characterList[character.characterId],
            exp: character.exp,
            id: character.characterId,
        };
        
        characters.push(characterInList);
    })
    

    return new Response(JSON.stringify(characters));
}

export async function POST(request: NextRequest) {
    return new Response();
}