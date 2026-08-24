import type { Route } from "./+types/home";
import {useState} from "react";
import {useActionData} from "react-router";
import { LoginForm } from '~/components/LoginForm'
import { SignupForm } from "~/components/SignupForm";
import {createUser, verifyLogin} from "~/server/user.server";
import {createUserSession} from "~/server/session.server";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export async function action({request} : Route.ActionArgs){
    const formData = await request.formData();
    const intent = formData.get("intent");

    if (intent === "login"){
        const email = formData.get("email");
        const password = formData.get("password");

        if (typeof email !== "string" || typeof password !== "string") {
            return {intent: "login", error: "Invalid form data."};
        }

        const userId = await verifyLogin({email, password});

        if (!userId) {
            return {intent: "login", error: "Invalid email or password."};
        }

        return createUserSession(userId, "/home");
    }

    if (intent === "signup"){
        const displayName = formData.get("displayName");
        const email = formData.get("email");
        const password = formData.get("password");
        const confirmPassword = formData.get("confirmPassword");

        if (
            typeof displayName !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string" ||
            typeof confirmPassword !== "string"
        ){
        return {intent: "signup", error: "Invalid form data."};
        }

        if (password !== confirmPassword) {
            return {intent: "signup", error: "Passwords do not match."};
        }

        try {
            const userId = await createUser({displayName, email, password});
            return createUserSession(userId, "/home");
        } catch (err){
            const message =
                err instanceof Error ? err.message : "Could not create account.";
            return {intent: "signup", error: message};
        }
    }

    return {error: "Unknown form submission"}
}

export default function Welcome() {
    const [isSignup, setIsSignup] = useState(true);
    const actionData = useActionData<typeof action>();

    return (
        <div className="min-h-screen bg-gray-800 text-neutral-200">
            <div className="font-bold text-5xl flex justify-center items-center p-3">
                League Fitness
            </div>
            <div className="text-sm pb-2 border-b flex items-center justify-center">
                Track your workouts and compete with friends!
            </div>

            <div className="flex flex-col items-center pt-5 ">
                <div className="bg-neutral-600 rounded-lg p-6 min-h-70 w-full max-w-md">
                    {isSignup ? (
                        <SignupForm
                            error={
                                actionData?.intent === "signup"
                                    ? actionData.error
                                    : undefined
                            }
                        />
                    ) : (
                        <LoginForm
                            error={
                                actionData?.intent === "login"
                                    ? actionData.error
                                    : undefined
                            }
                        />
                    )}
                </div>

                <button
                    className="text-blue-600 mt-2"
                    onClick={() => setIsSignup(!isSignup)}
                >
                    {isSignup
                        ? "Already have an account?"
                        : "Need an account?"}
                </button>
            </div>
        </div>
    );
}