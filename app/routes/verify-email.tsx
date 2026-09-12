import type { Route } from "./+types/verify-email";
import {Link} from "react-router";
import {verifyEmailToken} from "~/server/user.server";

export async function loader({request}: Route.LoaderArgs) {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");

    if (!token) {
        return {success: false};
    }

    const success = await verifyEmailToken(token);
    return {success};
}

export default function VerifyEmail({loaderData}: Route.ComponentProps) {
    const {success} = loaderData;

    return (
        <div className="min-h-screen bg-gray-800 text-neutral-200 flex flex-col items-center justify-center gap-4">
            <h1 className="text-3xl font-bold">
                {success ? "Email verified! ✅" : "Verification failed"}
            </h1>
            <p>
                {success
                    ? "You can now post, like, and comment."
                    : "This link is invalid or has expired."}
            </p>
            <Link to="/home" className="underline">Go to home</Link>
        </div>
    );
}