import {useState} from "react";
import { Form } from "react-router";
import { useNavigation } from "react-router";

type Props = {
    error?: string;
};

function slugify(input: string) {
    return input.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 20);
}

export function SignupForm({ error }: Props) {
    const navigation = useNavigation();
    const isSubmitting = navigation.state === "submitting";

    const [displayName, setDisplayName] = useState("");
    const [username, setUsername] = useState("");

    return (
        <Form
            method="post"
            className="flex flex-col gap-4 flex-1"
        >
            <input type="hidden" name="intent" value="signup" />

            <p className="flex justify-center pb-2 font-bold">
                Create an account to start logging!
            </p>

            <div className="flex flex-col gap-1">
                <label>Display Name:</label>
                <input
                    className="border-b text-neutral-200"
                    name="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                />
            </div>

            <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                    <label>Username:</label>
                </div>
                <input
                    className="border-b text-neutral-200"
                    name="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(slugify(e.target.value))}
                    required
                />
                <p className="text-xs text-neutral-400">
                    This is your unique handle and cannot be changed!
                </p>
            </div>

            <div className="flex flex-col gap-1">
                <label>Email:</label>
                <input
                    className="border-b text-neutral-200"
                    name="email"
                    type="email"
                    required
                />
            </div>

            <div className="flex flex-col gap-1">
                <label>Password:</label>
                <input
                    className="border-b text-neutral-200"
                    name="password"
                    type="password"
                    required
                />
            </div>

            <div className="flex flex-col gap-1">
                <label>Confirm Password:</label>
                <input
                    className="border-b text-neutral-200"
                    name="confirmPassword"
                    type="password"
                    required
                />
            </div>

            <div className="flex justify-center mt-4">
                <button
                    className="border rounded-md px-4 py-2 font-bold bg-green-700 disabled:opacity-50"
                    type="submit"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? "Signing up..." : "Sign Up"}
                </button>
            </div>
            <div className="underline flex flex-col items-center justify-center text-red-600">
                {error && <p>{error}</p>}
            </div>
        </Form>
    );
}