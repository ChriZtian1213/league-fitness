import { createCookieSessionStorage, redirect } from "react-router";
import {getUserById} from "~/server/user.server";

type SessionData = {
    userId: string;
};

export async function requireVerifiedUser(request: Request): Promise<string> {
    const userId = await requireUserId(request);
    const user = await getUserById(userId);
    if (!user?.emailVerified){
        throw new Response("Please verify your email to do that.", {status: 403})
    }
    return userId;
}

export const sessionStorage =
    createCookieSessionStorage<SessionData>({
        cookie: {
            name: "__session",

            httpOnly: true,
            path: "/",
            sameSite: "lax",

            secure: process.env.NODE_ENV === "production",

            secrets: [
                process.env.SESSION_SECRET!
            ],

            maxAge: 60 * 60 * 24 * 7, // 7 days
        },
    });

export const {
    getSession,
    commitSession,
    destroySession,
} = sessionStorage;

export async function createUserSession(
    userId: string,
    redirectTo: string
) {
    const session = await getSession();

    session.set("userId", userId);

    throw redirect(redirectTo, {
        headers: {
            "Set-Cookie": await commitSession(session),
        },
    });
}

export async function getUserId(
    request: Request
): Promise<string | undefined> {
    const session = await getSession(request.headers.get("Cookie"));
    return session.get("userId");
}

export async function requireUserId(
    request: Request
): Promise<string> {
    const userId = await getUserId(request);
    if (!userId) {
        const params = new URLSearchParams([
            ["redirectTo", new URL(request.url).pathname],
        ]);

        throw redirect(`/?${params}`);
    }

    return userId;
}

export async function logout(request: Request) {
    const session = await getSession(request.headers.get("Cookie"));

    throw redirect("/", {
        headers: {
            "Set-Cookie": await destroySession(session),
        },
    });
}