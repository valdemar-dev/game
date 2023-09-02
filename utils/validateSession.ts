import prisma from "./prismaClient";

export default async function validateSession(sessionId: string | undefined) {
    const session = await prisma.session.findUnique({
        where: {
            id: sessionId,
        }
    }) || null;

    if (!session) {
        return { 
            response: new Response("Invalid session id.", {
                status: 422,
            }),
            code: 422,
            userId: null,
        }
    }

    return {
        response: new Response("Session id is valid.", {
            status: 200,
        }),
        code: 200,
        userId: session.userId,
    }
}