import prisma from "./prismaClient";
export default async function validateSession(sessionId: string) {
    const session = await prisma.session.findUnique({
        id: sessionId,
    }) || null;

    if (!session) {
        return { 
            response: new Response("Invalid session id.", {
                status: 422,
            }),
            code: 422,
        }
    }

    return {
        response: new Response("Session id is valid.", {
            status: 200,
        }),
        code: 200,
    }
}