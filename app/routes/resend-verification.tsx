import type {Route} from "./+types/resend-verification";
import {redirect} from "react-router";
import {requireUserId} from "~/server/session.server";
import {getUserById, resendVerificationEmail} from "~/server/user.server";
import {sendVerificationEmail} from "~/server/email.server";

export async function action({request}: Route.ActionArgs) {
    const userId = await requireUserId(request);
    const user = await getUserById(userId);

    const referer = request.headers.get("referer");
    const backTo = referer ?? "/home";

    if (user && !user.emailVerified) {
        const result = await resendVerificationEmail(userId);

        if (result && "token" in result) {
            const url = new URL(request.url);
            const verifyUrl = `${url.origin}/verify-email?token=${result.token}`;
            await sendVerificationEmail(user.email, verifyUrl);
        }

        // If result has cooldownSecondsRemaining, we silently skip sending —
        // the banner below will show the cooldown state on next render.
    }

    return redirect(backTo);
}