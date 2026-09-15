import { useState } from "react";
import type { Category, Muscle} from "../types/workout.ts";
import type { Exercise, LoggingType } from "../types/exercise.ts";

const MAX_VISIBLE_EXERCISES = 6;

type Props = {
    category: Category;
    muscle: Muscle | null
    exercises: Exercise[]
    existingExerciseNames: string[]
    onSelectExercise: (exercise: Exercise) => void
    onCreateExercise: (name: string) => void
    onBack: () => void
    onHome?: ()=> void
}

const muscleLabels: Record<Muscle, string> = {
    chest: "Chest", back: "Back", triceps: "Triceps", shoulders: "Shoulders", biceps: "Biceps",
    glutes: "Glutes", hamstrings: "Hamstrings", quads: "Quads", calves: "Calves",
};

const categoryLabels: Record<Category, string> = {
    upper: "Upper Body", lower: "Lower Body", cardio: "Cardio",
};

export function ExerciseStep({ category, muscle, exercises, onSelectExercise, existingExerciseNames, onCreateExercise, onBack, onHome}: Props) {
    const [query, setQuery] = useState("");
    const [loggingType, setLoggingType] = useState<LoggingType>("standard");

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

    const visibleExercises = filteredExercises.slice(0, MAX_VISIBLE_EXERCISES);

    const noResults = query.length > 0 && filteredExercises.length === 0

    const exactExistingMatch = existingExerciseNames.find(
        (name) => name.toLowerCase() === query.toLowerCase()
    );

    const heading = muscle ? muscleLabels[muscle] : categoryLabels[category];

    return (
        <div className={"flex flex-col items-center gap-2"}>
            <p className="font-bold text-xl">{heading}</p>

            <input
                type="text"
                placeholder="Search exercise..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                list="existing-exercise-names"
                autoComplete="off"
                className="border rounded-md px-3 py-2 bg-transparent text-neutral-200 w-64"
            />
            <datalist
                id="existing-exercise-names">
                {existingExerciseNames.map((name) => (
                    <option key={name} value={name} />
                ))}
            </datalist>

            <div className="flex flex-row flex-wrap justify-center gap-2">
                {visibleExercises.map((exercise) => (
                    <button
                        className={"size-24 border"}
                        key={exercise.id}
                        onClick={() => onSelectExercise(exercise)}
                    >
                        {exercise.name}
                    </button>
                ))}
            </div>

            {filteredExercises.length > MAX_VISIBLE_EXERCISES && (
                <p className="text-xs text-neutral-400">
                    Showing {MAX_VISIBLE_EXERCISES} of {filteredExercises.length} — keep typing to narrow down
                </p>
            )}

            {noResults && (
                <div className="flex flex-col items-center gap-1">
                    <p className="text-xs text-neutral-500 text-center max-w-xs">
                        Tip: name exercises "[Equipment] [Movement]" — e.g. "Dumbbell Incline Press."
                        Use "Triceps" not "Tricep" for two-arm exercises — for single-arm work, say so (e.g. "Single-Arm Dumbbell Row").
                    </p>
                    <button
                        className={"size-24 border"}
                        onClick={() =>
                            onCreateExercise(exactExistingMatch ?? query)
                        }
                    >
                        <p>➕</p>"{exactExistingMatch ?? query}"
                    </button>
                </div>
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