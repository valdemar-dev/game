import { NextRequest } from "next/server";
import characterListData from "@/../lib/characters.json";

export async function GET(request: NextRequest) {
    const characterList = Array.from(Object.keys(characterListData));

    return new Response(JSON.stringify(characterList));
}