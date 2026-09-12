import type {Route} from "./+types/resend-verification";
import {redirect} from "react-router";
import {requireUserId} from "~/server/session.server";
import {getUserById, resendVerificationEmail} from "~/server/user.server";
import {sendVerificationEmail} from "~/server/email.server";

export async function action({request}: Route.ActionArgs) {
    const userId = await requireUserId(request);
    const user = await getUserById(userId);

    if (user && !user.emailVerified) {
        const token = await resendVerificationEmail(userId);
        if (token) {
            const url = new URL(request.url);
            const verifyUrl = `${url.origin}/verify-email?token=${token}`;
            await sendVerificationEmail(user.email, verifyUrl);
        }
    }

    const referer = request.headers.get("referer");
    return redirect(referer ?? "/home");
}