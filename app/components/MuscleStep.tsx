import type { Category, Muscle } from "../types/workout.ts"

type Props = {
    category: Category
    onSelect: (muscle: Muscle) => void
    onBack: () => void
}

export function MuscleStep({category, onSelect, onBack}: Props)  {
    return (
        <div>
            <p>Muscle Step goes here!</p>
            {category === "upper" && (
                <>
                    <div className={"flex gap-2"}>
                        <button
                            className={"size-24 border"}
                            onClick={() => onSelect("chest")}>
                            Chest
                        </button>

                        <button
                            className={"size-24 border"}
                            onClick={() => onSelect("triceps")}>
                            Triceps
                        </button>

                        <button
                            className={"size-24 border"}
                            onClick={() => onSelect("shoulders")}>
                            Shoulders
                        </button>

                        <button
                            className={"size-24 border"}
                            onClick={() => onSelect("biceps")}>
                            Biceps
                        </button>
                    </div>
                </>
            )}

            {category === "lower" && (
                <>
                    <div>
                        <button
                            className={"size-24 border"}
                            onClick={() => onSelect("glutes")}>
                            Glutes
                        </button>
                        <button
                            className={"size-24 border"}
                            onClick={() => onSelect("hamstrings")}>
                            Hamstrings
                        </button>
                        <button
                            className={"size-24 border"}
                            onClick={() => onSelect("quads")}>
                            Quads
                        </button>
                        <button
                            className={"size-24 border"}
                            onClick={() => onSelect("calves")}>
                            Calves
                        </button>

                    </div>
                </>
            )}

            <button
                className={"mt-4 size-16 border"}
                onClick={onBack}>
                🔙 Return
            </button>
        </div>
    )
}