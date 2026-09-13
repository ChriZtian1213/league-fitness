import type {Route} from "./+types/reset-password";
import {Form, useActionData, useNavigate} from "react-router";
import {requireUserId} from "~/server/session.server";
import {changePassword} from "~/server/user.server";
import {NavBar} from "~/components/NavBar";

export async function loader({request}: Route.LoaderArgs) {
    await requireUserId(request);
    return null;
}

export async function action({request}: Route.ActionArgs) {
    const userId = await requireUserId(request);
    const formData = await request.formData();

    const currentPassword = formData.get("currentPassword");
    const newPassword = formData.get("newPassword");
    const confirmNewPassword = formData.get("confirmNewPassword");

    if (
        typeof currentPassword !== "string" ||
        typeof newPassword !== "string" ||
        typeof confirmNewPassword !== "string"
    ) {
        return {error: "Invalid form data."};
    }

    if (newPassword !== confirmNewPassword) {
        return {error: "New passwords do not match."};
    }

    try {
        await changePassword(userId, currentPassword, newPassword);
        return {ok: true, passwordChanged: true};
    } catch (err) {
        const message = err instanceof Error ? err.message : "Could not change password.";
        return {error: message};
    }
}

export default function ResetPassword() {
    const actionData = useActionData<typeof action>();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-800 text-neutral-200 pb-24 flex flex-col items-center">
            <div className="font-bold text-4xl flex justify-center items-center p-3">
                League Fitness
            </div>
            <h1 className="font-bold text-xl p-4">Change Password</h1>

            <Form
                method="post"
                className="flex flex-col gap-3 w-full max-w-md px-4"
            >
                <label className="text-sm text-neutral-400">
                    Current password
                    <input
                        name="currentPassword"
                        type="password"
                        required
                        className="block w-full mt-1 border rounded-md px-3 py-2 bg-transparent text-neutral-200"
                    />
                </label>

                <label className="text-sm text-neutral-400">
                    New password
                    <input
                        name="newPassword"
                        type="password"
                        required
                        minLength={8}
                        className="block w-full mt-1 border rounded-md px-3 py-2 bg-transparent text-neutral-200"
                    />
                </label>

                <label className="text-sm text-neutral-400">
                    Confirm new password
                    <input
                        name="confirmNewPassword"
                        type="password"
                        required
                        minLength={8}
                        className="block w-full mt-1 border rounded-md px-3 py-2 bg-transparent text-neutral-200"
                    />
                </label>

                <button type="submit" className="border rounded-md px-4 py-2 font-bold bg-green-700">
                    Update Password
                </button>

                {actionData?.error && (
                    <p className="text-red-400 text-sm text-center">{actionData.error}</p>
                )}
                {actionData?.passwordChanged && (
                    <p className="text-green-400 text-sm text-center">Password updated!</p>
                )}

                <button
                    type="button"
                    onClick={() => navigate("/profile")}
                    className="text-sm text-neutral-400 underline"
                >
                    Back to profile
                </button>
            </Form>

            <NavBar />
        </div>
    );
}