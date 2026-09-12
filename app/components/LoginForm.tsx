import { Form, useNavigation } from "react-router";

type Props = {
    error?: string;
};

export function LoginForm({ error }: Props) {
    const navigation = useNavigation();
    const isSubmitting = navigation.state === "submitting";

    return (
        <Form
            method="post"
            className="flex flex-col gap-4 flex-1 justify-center"
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

            <div className="flex justify-center mt-4">
                <button
                    className="border rounded-md px-4 py-2 font-bold bg-green-700 disabled:opacity-50"
                    type="submit"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? "Signing in..." : "Sign In"}
                </button>
            </div>
            <div className="underline flex flex-col items-center justify-center text-red-600">
                {error && <p>{error}</p>}
            </div>
        </Form>
    );
}