import type {Route} from "./+types/create-post"
import {useState} from "react";
import {Form, redirect, useActionData, useLoaderData, useNavigation} from "react-router";
import {requireUserId, requireVerifiedUser} from "~/server/session.server";
import {createPost} from "~/server/post.server";
import {NavBar} from "~/components/NavBar";
import {CooldownTimer} from "~/components/CooldownTimer";
import {ImageCropModal, type ShapeOption} from "~/components/ImageCropModal";
import {getUserById, getResendCooldownSeconds} from "~/server/user.server";

const SHAPE_OPTIONS: ShapeOption[] = [
    {key: "square", aspect: 1, cropShape: "rect", label: "Square"},
    {key: "landscape", aspect: 4 / 3, cropShape: "rect", label: "Horizontal"},
    {key: "portrait", aspect: 3 / 4, cropShape: "rect", label: "Vertical"},
];

export async function loader({request}: Route.LoaderArgs) {
    const userId = await requireUserId(request);
    const user = await getUserById(userId);
    const cooldownSeconds = user && !user.emailVerified
        ? await getResendCooldownSeconds(userId)
        : 0;
    return {user, cooldownSeconds};
}

export async function action({request}: Route.ActionArgs) {
    let userId: string;
    try {
        userId = await requireVerifiedUser(request);
    } catch (err) {
        if (err instanceof Response && err.status >= 300 && err.status < 400) {
            throw err;
        }
        return {error: "Please verify your email before posting."};
    }

    const formData = await request.formData();
    const imageData = formData.get("imageData");
    const caption = formData.get("caption");

    if (typeof imageData !== "string" || !imageData.startsWith("data:image")) {
        return {error: "Please choose and crop an image."};
    }

    await createPost(userId, {
        imageData,
        caption: typeof caption === "string" && caption.trim() ? caption.trim() : undefined,
    });

    return redirect("/home");
}

export default function CreatePost() {
    const {user, cooldownSeconds} = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>();
    const navigation = useNavigation();
    const isSubmitting = navigation.state === "submitting";

    const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
    const [croppedImage, setCroppedImage] = useState<string | null>(null);
    const [croppedShapeKey, setCroppedShapeKey] = useState<string>("square");

    function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => setRawImageSrc(reader.result as string);
        reader.readAsDataURL(file);
    }

    const previewAspectClass =
        croppedShapeKey === "landscape" ? "aspect-[4/3]" :
            croppedShapeKey === "portrait" ? "aspect-[3/4]" :
                "aspect-square";

    return (
        <div className="min-h-screen bg-gray-800 text-neutral-200 pb-24 flex flex-col items-center">
            {user && !user.emailVerified && (
                <div className="bg-yellow-700 text-center py-2 text-sm flex flex-col items-center gap-1 w-full max-w-md mx-4 rounded-md mb-2">
                    <p>Verify your email to post.</p>
                    <CooldownTimer initialSeconds={cooldownSeconds} />
                </div>
            )}

            <div className="font-bold text-4xl flex justify-center items-center p-3">
                League Fitness
            </div>
            <h1 className="font-bold text-xl p-4">New Post</h1>

            <Form
                method="post"
                className="flex flex-col gap-4 w-full max-w-md px-4"
                onSubmit={() => setRawImageSrc(null)}
            >
                <input type="hidden" name="imageData" value={croppedImage ?? ""} />

                <div className="flex flex-col gap-2">
                    {croppedImage && (
                        <img
                            src={croppedImage}
                            alt="Post preview"
                            className={`w-full max-w-xs mx-auto border-2 border-black object-cover ${previewAspectClass}`}
                        />
                    )}

                    <label className="text-sm">
                        <span className="inline-block cursor-pointer border border-neutral-500 rounded-md bg-neutral-700 text-neutral-200 font-bold px-4 py-2 hover:bg-neutral-600">
                            {croppedImage ? "Choose a different photo" : "Choose photo"}
                        </span>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                    </label>
                </div>

                <textarea
                    name="caption"
                    placeholder="Write a caption..."
                    className="border rounded-md p-2 bg-transparent text-neutral-200"
                    rows={3}
                />
                <button
                    type="submit"
                    className="border rounded-md px-4 py-2 font-bold bg-green-700 disabled:opacity-50"
                    disabled={isSubmitting || !croppedImage}
                >
                    {isSubmitting ? "Sharing..." : "Share"}
                </button>
                {actionData?.error && (
                    <p className="text-red-400 text-center">{actionData.error}</p>
                )}
            </Form>

            {rawImageSrc && (
                <ImageCropModal
                    imageSrc={rawImageSrc}
                    shapeOptions={SHAPE_OPTIONS}
                    initialShapeKey={croppedShapeKey}
                    onCancel={() => setRawImageSrc(null)}
                    onCropDone={(dataUrl, shapeKey) => {
                        setCroppedImage(dataUrl);
                        setCroppedShapeKey(shapeKey);
                        setRawImageSrc(null);
                    }}
                />
            )}

            <NavBar/>
        </div>
    );
}