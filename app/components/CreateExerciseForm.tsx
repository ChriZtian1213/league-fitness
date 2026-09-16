import { useState } from "react";
import type { Category, Muscle } from "~/types/workout";
import type { LoggingType } from "~/types/exercise";

type Props = {
    initialName?: string;
    onCreate: (
        name: string,
        category: Category,
        muscle: Muscle | undefined,
        loggingTypes: LoggingType[]
    ) => void;
    onCancel: () => void;
};

const loggingTypeOptions: LoggingType[] = [
    "dumbbell",
    "standard",
    "starting-weight",
    "bodyweight",
    "timed",
];

const loggingTypeLabels: Record<LoggingType, string> = {
    dumbbell: "Dumbbell",
    standard: "Standard",
    "starting-weight": "Plate Calculator",
    bodyweight: "Bodyweight",
    timed: "Timed",
};

const muscleOptions: {value: Muscle; label: string}[] = [
    {value: "shoulders", label: "Shoulders"},
    {value: "chest", label: "Chest"},
    {value: "triceps", label: "Triceps"},
    {value: "back", label: "Back"},
    {value: "biceps", label: "Biceps"},
    {value: "abs", label: "Abs"},
    {value: "quads", label: "Quads"},
    {value: "hamstrings", label: "Hamstrings"},
    {value: "glutes", label: "Glutes"},
    {value: "calves", label: "Calves"},
];

export function CreateExerciseForm({initialName = "", onCreate, onCancel}: Props) {
    const [name, setName] = useState(initialName);
    const [category, setCategory] = useState<Category>("upper");
    const [muscle, setMuscle] = useState<Muscle | "">("");
    const [selectedLoggingTypes, setSelectedLoggingTypes] = useState<LoggingType[]>(["standard"]);

    function toggleLoggingType(type: LoggingType) {
        setSelectedLoggingTypes((prev) =>
            prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
        );
    }

    function handleCreate() {
        if (!name.trim()) {
            alert("Please enter an exercise name.");
            return;
        }
        if (category !== "cardio" && muscle === "") {
            alert("Please select a muscle group.");
            return;
        }
        if (selectedLoggingTypes.length === 0) {
            alert("Please select at least one logging type.");
            return;
        }
        onCreate(name.trim(), category, muscle === "" ? undefined : muscle, selectedLoggingTypes);
    }

    return (
        <div className="flex flex-col items-center gap-3 w-full max-w-md px-4">
            <p className="font-bold text-xl">Create Exercise</p>

            <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Exercise name"
                className="border rounded-md px-3 py-2 bg-transparent text-neutral-200 w-full"
                autoComplete="off"
            />

            <p className="text-xs text-neutral-500 text-center max-w-xs break-words">
                Tip: name exercises "[Equipment] [Movement]" — e.g. "Dumbbell Incline Press."
                Use "Triceps" not "Tricep" for two-arm exercises — for single-arm work, say so ("Single-Arm Dumbbell Row").
            </p>

            <div className="flex border border-neutral-500 rounded-md overflow-hidden text-sm">
                {(["upper", "lower", "cardio"] as Category[]).map((c) => (
                    <button
                        key={c}
                        type="button"
                        onClick={() => {
                            setCategory(c);
                            setMuscle("");
                        }}
                        className={`px-3 py-1.5 ${category === c ? "bg-neutral-500" : ""}`}
                    >
                        {c === "upper" ? "Upper" : c === "lower" ? "Lower" : "Cardio"}
                    </button>
                ))}
            </div>

            {category !== "cardio" && (
                <div className="flex flex-wrap justify-center gap-2">
                    {muscleOptions.map((m) => (
                        <button
                            key={m.value}
                            type="button"
                            onClick={() => setMuscle(m.value)}
                            className={`px-3 py-2 border rounded-md text-sm ${
                                muscle === m.value
                                    ? "bg-neutral-500 border-neutral-400"
                                    : "border-neutral-600"
                            }`}
                        >
                            {m.label}
                        </button>
                    ))}
                </div>
            )}

            {category !== "cardio" && (
                <>
                    <p className="text-xs text-neutral-400">How is this logged?</p>
                    <div className="flex flex-wrap justify-center gap-2">
                        {loggingTypeOptions.map((type) => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => toggleLoggingType(type)}
                                className={`px-3 py-1.5 border rounded-md text-sm ${
                                    selectedLoggingTypes.includes(type)
                                        ? "bg-neutral-500 border-neutral-400"
                                        : "border-neutral-600"
                                }`}
                            >
                                {loggingTypeLabels[type]}
                            </button>
                        ))}
                    </div>
                </>
            )}

            <div className="flex gap-2 mt-2">
                <button
                    type="button"
                    onClick={handleCreate}
                    className="border rounded-md px-4 py-2 font-bold bg-green-700"
                >
                    Create Exercise
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="border rounded-md px-4 py-2"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}