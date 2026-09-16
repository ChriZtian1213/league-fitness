import type { Category, Muscle } from "../types/workout.ts"

type Props = {
    category: Category
    onSelect: (muscle: Muscle) => void
    onBack: () => void
}

const categoryLabels: Record<Category, string> = {
    upper: "Upper Body",
    lower: "Lower Body",
    cardio: "Cardio",
};

export function MuscleStep({category, onSelect, onBack}: Props)  {
    return (
        <div className="flex flex-col items-center gap-2">
            <p className="font-bold text-xl">{categoryLabels[category]}</p>

            {category === "upper" && (
                <div className="flex flex-row flex-wrap justify-center gap-2">
                    <button className="size-24 border" onClick={() => onSelect("shoulders")}>Shoulders</button>
                    <button className="size-24 border" onClick={() => onSelect("chest")}>Chest</button>
                    <button className="size-24 border" onClick={() => onSelect("triceps")}>Triceps</button>
                    <button className="size-24 border" onClick={() => onSelect("back")}>Back</button>
                    <button className="size-24 border" onClick={() => onSelect("biceps")}>Biceps</button>
                    <button className="size-24 border" onClick={() => onSelect("abs")}>Abs</button>
                </div>
            )}

            {category === "lower" && (
                <div className="flex flex-row flex-wrap justify-center gap-2">
                    <button className="size-24 border" onClick={() => onSelect("quads")}>Quads</button>
                    <button className="size-24 border" onClick={() => onSelect("hamstrings")}>Hamstrings</button>
                    <button className="size-24 border" onClick={() => onSelect("glutes")}>Glutes</button>
                    <button className="size-24 border" onClick={() => onSelect("calves")}>Calves</button>
                </div>
            )}

            <button className="mt-4 size-16 border" onClick={onBack}>
                🔙 Return
            </button>
        </div>
    )
}