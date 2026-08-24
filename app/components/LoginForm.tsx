import { Form } from "react-router";

type Props = {
    error?: string;
};

export function LoginForm({ error }: Props) {
    return (
        <Form
            method="post"
            className="flex flex-col gap-4 min-h-100"
        >
            <input type="hidden" name="intent" value="login" />

            <p className="flex justify-center pb-2">Lets get you signed in!</p>

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

            <div className="flex justify-center mt-4 text-green-600">
                <button
                    className="border rounded-md px-4 py-2 font-bold"
                    type="submit"
                >
                    Sign In
                </button>
            </div>
            <div className="underline flex flex-col items-center justify-center text-red-600">
                {error && <p>{error}</p>}
            </div>
        </Form>
    );
}
