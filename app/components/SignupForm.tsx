import { Form } from "react-router";

type Props = {
    error?: string;
};

export function SignupForm({ error }: Props) {
    return (
        <Form
            method="post"
            className="flex flex-col gap-4 min-h-100"
        >
            <input type="hidden" name="intent" value="signup" />

            <p className="flex justify-center pb-2">
                Create an account to start logging!
            </p>

            <div className="flex flex-col gap-1">
                <label>Display Name:</label>
                <input
                    className="border-b text-neutral-200"
                    name="displayName"
                    type="text"
                    required
                />
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
                    className="border rounded-md px-4 py-2 font-bold"
                    type="submit"
                >
                    Sign Up
                </button>
            </div>
            <div className="underline flex flex-col items-center justify-center text-red-600">
                {error && <p>{error}</p>}
            </div>
        </Form>
    );
}