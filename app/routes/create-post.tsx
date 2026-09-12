import type {Route} from "./+types/create-post"
import {Form, redirect, useActionData, useLoaderData} from "react-router";
import {requireUserId, requireVerifiedUser} from "~/server/session.server";
import {createPost} from "~/server/post.server";
import {NavBar} from "~/components/NavBar";
import {getUserById} from "~/server/user.server";

export async function loader({request}: Route.LoaderArgs) {
    const userId = await requireUserId(request);
    const user = await getUserById(userId);
    return {user};
}

export async function action({request}: Route.ActionArgs) {
    let userId: string;
    try {
        userId = await requireVerifiedUser(request);
    } catch (err) {
        if (err instanceof Response && err.status >= 300 && err.status < 400) {
            throw err; // real redirect (e.g. not logged in) — let it through
        }
        return {error: "Please verify your email before posting."};
    }

    const formData = await request.formData();

    const image = formData.get("image");
    const caption = formData.get("caption");

    if (!(image instanceof File) || image.size === 0) {
        return {error: "Please choose an image."};
    }

    if (image.size > 5 * 1024 * 1024) {
        return {error: "Image must be under 5MB."};
    }

    const arrayBuffer = await image.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const imageData = `data:${image.type};base64,${base64}`;

    await createPost(userId, {
        imageData,
        caption: typeof caption === "string" && caption.trim() ? caption.trim() : undefined,
    });

    return redirect("/home");
}

export default function CreatePost() {
    const {user} = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>();

    return (
        <div className="min-h-screen bg-gray-800 text-neutral-200 pb-24 flex flex-col items-center">
            {user && !user.emailVerified && (
                <div className="bg-yellow-700 text-center py-2 text-sm flex flex-col items-center gap-1 w-full max-w-md mx-4 rounded-md mb-2">
                    <p>Verify your email to post.</p>
                    <Form method="post" action="/resend-verification">
                        <button type="submit" className="underline">Resend verification email</button>
                    </Form>
                </div>
            )}

            <div className="font-bold text-4xl flex justify-center items-center p-3">
                League Fitness
            </div>
            <h1 className="font-bold text-xl p-4">New Post</h1>

            <Form method="post" encType="multipart/form-data" className="flex flex-col gap-4 w-full max-w-md px-4">
                <input type="file" name="image" accept="image/*" required className="text-neutral-200"  />
                <textarea
                    name="caption"
                    placeholder="Write a caption..."
                    className="border rounded-md p-2 bg-transparent text-neutral-200"
                    rows={3}
                />
                <button type="submit" className="border rounded-md px-4 py-2 font-bold bg-green-700">
                    Share
                </button>
                {actionData?.error && (
                    <p className="text-red-400 text-center">{actionData.error}</p>
                )}
            </Form>

            <NavBar/>
        </div>
    );
}