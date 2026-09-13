import {useState, useCallback} from "react";
import Cropper from "react-easy-crop";

type Area = {x: number; y: number; width: number; height: number};

type Props = {
    imageSrc: string;
    onCancel: () => void;
    onCropDone: (croppedDataUrl: string) => void;
};

function createImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.addEventListener("load", () => resolve(img));
        img.addEventListener("error", reject);
        img.src = url;
    });
}

async function getCroppedImage(imageSrc: string, cropArea: Area): Promise<string> {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    canvas.width = cropArea.width;
    canvas.height = cropArea.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get canvas context.");

    ctx.drawImage(
        image,
        cropArea.x,
        cropArea.y,
        cropArea.width,
        cropArea.height,
        0,
        0,
        cropArea.width,
        cropArea.height
    );

    return canvas.toDataURL("image/jpeg", 0.9);
}

export function ImageCropModal({imageSrc, onCancel, onCropDone}: Props) {
    const [crop, setCrop] = useState({x: 0, y: 0});
    const [zoom, setZoom] = useState(1);
    const [croppedArea, setCroppedArea] = useState<Area | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const onCropComplete = useCallback((_croppedAreaPercent: Area, croppedAreaPixels: Area) => {
        setCroppedArea(croppedAreaPixels);
    }, []);

    async function handleSave() {
        if (!croppedArea) return;
        setIsSaving(true);
        try {
            const dataUrl = await getCroppedImage(imageSrc, croppedArea);
            onCropDone(dataUrl);
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-4">
            <div className="relative w-full max-w-sm h-80 bg-neutral-900">
                <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    cropShape="round"
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                />
            </div>

            <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full max-w-sm mt-4"
            />

            <div className="flex gap-3 mt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="border border-neutral-500 rounded-md px-4 py-2 text-neutral-200 bg-neutral-700"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="border rounded-md px-4 py-2 font-bold bg-green-700 disabled:opacity-50"
                >
                    {isSaving ? "Saving..." : "Save"}
                </button>
            </div>
        </div>
    );
}