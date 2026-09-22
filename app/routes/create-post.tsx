import type {Route} from "./+types/create-post"
import {useState} from "react";
import {Form, redirect, useActionData, useLoaderData, useNavigation} from "react-router";
import {requireUserId, requireVerifiedUser} from "~/server/session.server";
import {createPost} from "~/server/post.server";
import {NavBar} from "~/components/NavBar";
import {CooldownTimer} from "~/components/CooldownTimer";
import {ImageCropModal, type ShapeOption} from "~/components/ImageCropModal";
import {getUserById, getResendCooldownSeconds} from "~/server/user.server";
import { uploadImage } from "~/server/blob.server";

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
    const images = formData.getAll("images");
    const caption = formData.get("caption");

    const validImages = images.filter(
        (img): img is string => typeof img === "string" && img.startsWith("data:image")
    );

    if (validImages.length === 0) {
        return {error: "Please choose and crop at least one image."};
    }

    const imageUrls = await Promise.all(
        validImages.map((dataUrl, i) => uploadImage(dataUrl, `posts/${userId}-${Date.now()}-${i}`))
    );

    await createPost(userId, {
        imageUrls,
        caption: typeof caption === "string" && caption.trim() ? caption.trim() : undefined,
    });

    return redirect("/home");
}

export default function CreatePost() {
    const {user, cooldownSeconds} = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>();
    const navigation = useNavigation();
    const isSubmitting = navigation.state === "submitting";

    const MAX_PHOTOS = 5;

    const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
    const [croppedImages, setCroppedImages] = useState<{dataUrl: string; shapeKey: string}[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);

    function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        if (croppedImages.length >= MAX_PHOTOS) {
            alert(`You can add up to ${MAX_PHOTOS} photos per post.`);
            return;
        }

        const reader = new FileReader();
        reader.onload = () => setRawImageSrc(reader.result as string);
        reader.readAsDataURL(file);
    }

    function removePhoto(index: number) {
        setCroppedImages((prev) => prev.filter((_, i) => i !== index));
        setActiveIndex((prev) => Math.max(0, Math.min(prev, croppedImages.length - 2)));
    }

    const activePhoto = croppedImages[activeIndex];
    const previewAspectClass =
        activePhoto?.shapeKey === "landscape" ? "aspect-[4/3]" :
            activePhoto?.shapeKey === "portrait" ? "aspect-[3/4]" :
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
                {croppedImages.map((img, i) => (
                    <input key={i} type="hidden" name="images" value={img.dataUrl} />
                ))}

                <div className="flex flex-col gap-2">
                    {croppedImages.length > 0 && (
                        <div className="flex flex-col items-center gap-2">
                            <div className="relative w-full max-w-xs mx-auto">
                                <img
                                    src={activePhoto.dataUrl}
                                    alt={`Post preview ${activeIndex + 1}`}
                                    className={`w-full border-2 border-black object-cover ${previewAspectClass}`}
                                />
                                {croppedImages.length > 1 && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => setActiveIndex((i) => (i - 1 + croppedImages.length) % croppedImages.length)}
                                            className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center"
                                        >
                                            ‹
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setActiveIndex((i) => (i + 1) % croppedImages.length)}
                                            className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center"
                                        >
                                            ›
                                        </button>
                                    </>
                                )}
                                <button
                                    type="button"
                                    onClick={() => removePhoto(activeIndex)}
                                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                                >
                                    X
                                </button>
                            </div>

                            {croppedImages.length > 1 && (
                                <div className="flex gap-1">
                                    {croppedImages.map((_, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => setActiveIndex(i)}
                                            className={`w-2 h-2 rounded-full ${i === activeIndex ? "bg-neutral-200" : "bg-neutral-600"}`}
                                        />
                                    ))}
                                </div>
                            )}
                            <p className="text-xs text-neutral-400">{croppedImages.length} / {MAX_PHOTOS} photos</p>
                        </div>
                    )}

                    {croppedImages.length < MAX_PHOTOS && (
                        <label className="text-sm">
                            <span className="inline-block cursor-pointer border border-neutral-500 rounded-md bg-neutral-700 text-neutral-200 font-bold px-4 py-2 hover:bg-neutral-600">
                                {croppedImages.length === 0 ? "Choose photo" : "Add another photo"}
                            </span>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                        </label>
                    )}
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
                    disabled={isSubmitting || croppedImages.length === 0}
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
                    onCancel={() => setRawImageSrc(null)}
                    onCropDone={(dataUrl, shapeKey) => {
                        setCroppedImages((prev) => [...prev, {dataUrl, shapeKey}]);
                        setActiveIndex(croppedImages.length);
                        setRawImageSrc(null);
                    }}
                />
            )}

            <NavBar/>
        </div>
    );
}