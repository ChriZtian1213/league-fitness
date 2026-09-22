import { put, del } from "@vercel/blob";

export async function uploadImage(dataUrl: string, filename: string): Promise<string> {
    const match = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!match) {
        throw new Error("Invalid image data.");
    }
    const [, extension, base64Data] = match;
    const buffer = Buffer.from(base64Data, "base64");

    const blob = await put(`${filename}.${extension}`, buffer, {
        access: "public",
        contentType: `image/${extension}`,
    });

    return blob.url;
}

export async function deleteImage(url: string): Promise<void> {
    try {
        await del(url);
    } catch {
        // If the blob is already gone or the URL is malformed, don't
        // block the calling operation (e.g. deleting a post) over it.
    }
}

