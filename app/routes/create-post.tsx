import type {Route} from "./+types/create-post"
import {Form, redirect} from "react-router";
import {requireUserId} from "~/server/session.server";
import {createPost} from "~/server/post.server";
import {NavBar} from "~/components/NavBar";

export async function action({request}: Route.ActionArgs) {
    const userId = await requireUserId(request);
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
    return (
        <div className="min-h-screen bg-gray-800 text-neutral-200 pb-24 flex flex-col items-center">
            <h1 className="font-bold text-3xl p-4">New Post</h1>

            <Form method="post" encType="multipart/form-data" className="flex flex-col gap-4 w-full max-w-md px-4">
                <input type="file" name="image" accept="image/*" required className="text-neutral-200 shado"  />
                <textarea
                    name="caption"
                    placeholder="Write a caption..."
                    className="border rounded-md p-2 bg-transparent text-neutral-200"
                    rows={3}
                />
                <button type="submit" className="border rounded-md px-4 py-2 font-bold bg-green-700">
                    Share
                </button>
            </Form>

            <NavBar/>
        </div>
    );
}