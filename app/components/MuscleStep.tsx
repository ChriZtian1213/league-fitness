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
                    <div>
                        <button onClick={() => onSelect("chest")}>
                            Chest
                        </button>

                        <button onClick={() => onSelect("triceps")}>
                            Triceps
                        </button>

                        <button onClick={() => onSelect("shoulders")}>
                            Shoulders
                        </button>

                        <button onClick={() => onSelect("biceps")}>
                            Biceps
                        </button>
                    </div>
                </>
            )}

            {category === "lower" && (
                <>
                    <div>
                        <button onClick={() => onSelect("glutes")}>
                            Glutes
                        </button>
                    </div>
                </>
            )}

            <button onClick={onBack}>
                Return
            </button>
        </div>
    )
}