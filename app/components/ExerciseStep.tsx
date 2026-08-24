import { useState } from "react";
import type { Category, Muscle} from "../types/workout.ts";
import type { Exercise } from "../types/exercise.ts";


type Props = {
    category: Category;
    muscle: Muscle | null
    exercises: Exercise[]
    onSelectExercise: (exercise: Exercise) => void
    onCreateExercise: (name: string) => void
    onBack: () => void
    onHome?: ()=> void
}

export function ExerciseStep({ category, muscle, exercises, onSelectExercise, onCreateExercise, onBack, onHome}: Props) {
    const [query, setQuery] = useState("");

    const filteredExercises = exercises.filter((exercise) => {
        const matchesQuery = exercise.name
            .toLowerCase()
            .includes(query.toLowerCase())

        const matchesCategory = exercise.category === category;

        const matchesMuscle = muscle === null || exercise.muscle === muscle;

        return (
            matchesQuery && matchesCategory && matchesMuscle
        )
    })

    const noResults = query.length > 0 && filteredExercises.length === 0

    return (
        <div className={"flex flex-col gap-2"}>
            <h2>Exercise Step </h2>

            <input
                type="text"
                placeholder="Search exercise..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />

            <div className="flex flex-row gap-2">
                {filteredExercises.map((exercise) => (
                    <button
                        className={"size-24 border"}
                        key={exercise.id}
                        onClick={() =>
                            onSelectExercise(exercise)
                        }
                    >
                        {exercise.name}
                    </button>
                ))}
            </div>

            {noResults && (
                <button
                    className={"size-24 border"}
                    onClick={() =>
                        onCreateExercise(query)
                    }
                >
                    <p>➕</p>"{query}"
                </button>
            )}

            <div className="flex flex-row">
                <button
                    className={"mt-4 size-16 border"}
                    onClick={onBack}>
                    🔙 Return
                </button>
                {onHome && (
                    <button
                        className="mt-4 size-16 border"
                        onClick={onHome}
                    >
                        Home
                    </button>
                )}

            </div>
        </div>
    )
}