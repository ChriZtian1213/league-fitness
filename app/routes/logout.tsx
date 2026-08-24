import type { Route } from "./+types/home";
import { logout } from "~/server/session.server";

// No UI here — this route only exists to handle the POST from the
// logout button and destroy the session cookie.
export async function action({ request }: Route.ActionArgs) {
    return logout(request);
}

export async function loader({ request }: Route.LoaderArgs) {
    return logout(request);
}
