import { NextRequest } from "next/server";
import validateRequest from "@/utils/validateRequest";
import prisma from "@/utils/prismaClient";
import { cookies } from "next/headers";

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
        },
    });   

    const cookieStore = cookies();
    cookieStore.set({name: "sessionId", value: sessionId, secure: true, httpOnly: true, });

    return new Response(
        JSON.stringify({ text: "Registration complete!", })
    );
}