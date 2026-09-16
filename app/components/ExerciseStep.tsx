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
    onCreateExercise: (name: string, loggingTypes: LoggingType[]) => void
    onBack: () => void
    onHome?: ()=> void

}

const muscleLabels: Record<Muscle, string> = {
    chest: "Chest", back: "Back", triceps: "Triceps", shoulders: "Shoulders", biceps: "Biceps",
    glutes: "Glutes", hamstrings: "Hamstrings", quads: "Quads", calves: "Calves",
    abs: "Abs",
};

const categoryLabels: Record<Category, string> = {
    upper: "Upper Body", lower: "Lower Body", cardio: "Cardio",
};

export function ExerciseStep({ category, muscle, exercises, onSelectExercise, existingExerciseNames, onCreateExercise, onBack, onHome}: Props) {
    const [query, setQuery] = useState("");
    const [loggingType, setLoggingType] = useState<LoggingType>("standard");
    const [selectedLoggingTypes, setSelectedLoggingTypes] = useState<Set<LoggingType>>(new Set(["standard"]));
    function toggleLoggingType(type: LoggingType) {
        setSelectedLoggingTypes((prev) => {
            const next = new Set(prev);
            if (next.has(type)) {
                if (next.size > 1) next.delete(type); // always keep at least one selected
            } else {
                next.add(type);
            }
            return next;
        });
    }

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
                <div className="flex flex-col items-center gap-2 px-4 w-full">
                    <p className="text-xs text-neutral-500 text-center max-w-xs break-words">
                        Tip: name exercises "[Equipment] [Movement]" — e.g. "Dumbbell Incline Press."
                        Use "Triceps" not "Tricep" for two-arm exercises — for single-arm work, say so (e.g. "Single-Arm Dumbbell Row").
                    </p>

                    {category !== "cardio" && (
                        <div className="flex flex-col items-center gap-1">
                            <p className="text-xs text-neutral-400">How is this logged? (tap to select, multiple allowed)</p>
                            <div className="flex flex-wrap justify-center gap-1">
                                {(["standard", "dumbbell", "bodyweight", "starting-weight"] as LoggingType[]).map((type) => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => toggleLoggingType(type)}
                                        className={`px-3 py-1.5 border rounded-md text-xs ${
                                            selectedLoggingTypes.has(type)
                                                ? "bg-neutral-500 border-neutral-400"
                                                : "border-neutral-600 text-neutral-400"
                                        }`}
                                    >
                                        {type === "standard" && "Standard"}
                                        {type === "dumbbell" && "Dumbbell"}
                                        {type === "bodyweight" && "Bodyweight"}
                                        {type === "starting-weight" && "Plate Calculator"}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <button
                        className={"size-24 border flex flex-col items-center justify-center p-1"}
                        onClick={() =>
                            onCreateExercise(exactExistingMatch ?? query, [...selectedLoggingTypes])
                        }
                    >
                        <p>➕</p>
                        <p className="text-xs text-center break-words line-clamp-2">
                            "{exactExistingMatch ?? query}"
                        </p>
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