import {useState, useRef} from "react";

export function PostImageCarousel({imageUrls, caption}: {imageUrls: string[]; caption?: string}) {
    const [activeIndex, setActiveIndex] = useState(0);
    const touchStartX = useRef<number | null>(null);

    if (!imageUrls || imageUrls.length === 0) {
        return (
            <div className="w-full max-w-md aspect-square border-2 border-black bg-neutral-800 flex items-center justify-center text-neutral-500 text-sm">
                Image unavailable
            </div>
        );
    }

    function goTo(index: number) {
        setActiveIndex((index + imageUrls.length) % imageUrls.length);
    }

    function handleTouchStart(e: React.TouchEvent) {
        touchStartX.current = e.touches[0].clientX;
    }

    function handleTouchEnd(e: React.TouchEvent) {
        if (touchStartX.current === null) return;
        const deltaX = e.changedTouches[0].clientX - touchStartX.current;
        const SWIPE_THRESHOLD = 50;

        if (deltaX > SWIPE_THRESHOLD) {
            goTo(activeIndex - 1);
        } else if (deltaX < -SWIPE_THRESHOLD) {
            goTo(activeIndex + 1);
        }
        touchStartX.current = null;
    }

    return (
        <div className="relative w-full max-w-md">
            <div
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                <img
                    className="w-full border-2 border-black object-contain"
                    src={imageUrls[activeIndex]}
                    alt={caption ?? "Workout post"}
                />
            </div>

            {imageUrls.length > 1 && (
                <>
                    <button
                        type="button"
                        onClick={() => goTo(activeIndex - 1)}
                        className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center"
                        aria-label="Previous photo"
                    >
                        ‹
                    </button>
                    <button
                        type="button"
                        onClick={() => goTo(activeIndex + 1)}
                        className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center"
                        aria-label="Next photo"
                    >
                        ›
                    </button>

                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                        {imageUrls.map((_, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => goTo(i)}
                                className={`w-1.5 h-1.5 rounded-full ${i === activeIndex ? "bg-white" : "bg-white/40"}`}
                                aria-label={`Go to photo ${i + 1}`}
                            />
                        ))}
                    </div>

                    <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                        {activeIndex + 1}/{imageUrls.length}
                    </div>
                </>
            )}
        </div>
    );
}