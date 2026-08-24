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
}

export function ExerciseStep({ category, muscle, exercises, onSelectExercise, onCreateExercise, onBack }: Props) {
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
        <div>
            <h2>Select an Exercise</h2>

            <input
                type="text"
                placeholder="Search exercise..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />

            <div>
                {filteredExercises.map((exercise) => (
                    <button
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
                    onClick={() =>
                        onCreateExercise(query)
                    }
                >
                    Create "{query}"
                </button>
            )}

            <button onClick={onBack}>
                Return
            </button>
        </div>
    )
}