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

    const user = await prisma.user.findUnique({
        where: {
            username: req.username,
            password: req.password,
        },
    }) || null;

    if (!user) {
        return new Response("Incorrect login details.", {
            status: 401,
        });
    }

    const sessionId = crypto.randomUUID();

    await prisma.session.create({
        data: {
            userId: user.id,
            id: sessionId,
        },
    });

    const cookieStore = cookies();
    cookieStore.set({name: "sessionId", value: sessionId, });

    return new Response(
        JSON.stringify({ text: "Login complete!", })
    );
}