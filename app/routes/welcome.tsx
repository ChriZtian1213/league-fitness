import type { Route } from "./+types/home";
import {useState} from "react";
import {useActionData} from "react-router";
import { LoginForm } from '~/components/LoginForm'
import { SignupForm } from "~/components/SignupForm";
import {createUser, verifyLogin} from "~/server/user.server";
import {createUserSession} from "~/server/session.server";
import {sendVerificationEmail} from "~/server/email.server";

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
        const username = formData.get("username");
        const email = formData.get("email");
        const password = formData.get("password");
        const confirmPassword = formData.get("confirmPassword");

        if (
            typeof displayName !== "string" ||
            typeof username !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string" ||
            typeof confirmPassword !== "string"
        ){
            return {intent: "signup", error: "Invalid form data."};
        }

        const EMAIL_REGEX  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!EMAIL_REGEX.test(email)) {
            return {intent: "signup", error: "Invalid email address."};
        }

        if (password !== confirmPassword) {
            return {intent: "signup", error: "Passwords do not match."};
        }

        try {
            const {userId, verificationToken} = await createUser({displayName, username, email, password});
            const url = new URL(request.url);
            const verifyUrl = `${url.origin}/verify-email?token=${verificationToken}`;
            await sendVerificationEmail(email, verifyUrl);

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
                <div className="flex mb-4 w-32">
                    <button
                        className={`flex-1 py-2 ${isSignup ? "text-neutral-400" : "border-b-2 border-blue-500 text-white"}`}
                        onClick={() => setIsSignup(false)}
                    >
                        Log In
                    </button>
                    <button
                        className={`flex-1 py-2 ${isSignup ? "border-b-2 border-blue-500 text-white" : "text-neutral-400"}`}
                        onClick={() => setIsSignup(true)}
                    >
                        Sign Up
                    </button>
                </div>
                <div className="bg-neutral-600 rounded-lg p-6 h-[560px] w-full max-w-md flex flex-col">
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
            </div>
        </div>
    );
}