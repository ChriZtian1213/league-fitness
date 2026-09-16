import { useState } from "react";
import type { RoutineEntry } from "~/server/routine.server";

type Props = {
    routines: RoutineEntry[];
    allExerciseNames: string[];
    editRoutineId?: string | null;
    onStartRoutine: (routine: RoutineEntry) => void;
    onCreateRoutine: (name: string, exerciseNames: string[]) => void;
    onUpdateRoutine: (routineId: string, name: string, exerciseNames: string[]) => void;
    onDeleteRoutine: (routineId: string) => void;
    onBack: () => void;
}

export function RoutinesStep({routines, allExerciseNames, editRoutineId, onStartRoutine, onCreateRoutine, onUpdateRoutine, onDeleteRoutine, onBack}: Props) {
    const [editingRoutine, setEditingRoutine] = useState<RoutineEntry | null>(() => {
        if (editRoutineId) {
            return routines.find((r) => r.id === editRoutineId) ?? null;
        }
        return null;
    });
    const [isCreating, setIsCreating] = useState(false);
    const [name, setName] = useState(editingRoutine?.name ?? "");
    const [selectedExercises, setSelectedExercises] = useState<string[]>(editingRoutine?.exerciseNames ?? []);
    const [query, setQuery] = useState("");

    function startEditing(routine: RoutineEntry) {
        setEditingRoutine(routine);
        setName(routine.name);
        setSelectedExercises(routine.exerciseNames);
        setQuery("");
    }

    function startCreating() {
        setIsCreating(true);
        setEditingRoutine(null);
        setName("");
        setSelectedExercises([]);
        setQuery("");
    }

    function toggleExercise(exerciseName: string) {
        setSelectedExercises((prev) =>
            prev.includes(exerciseName)
                ? prev.filter((n) => n !== exerciseName)
                : [...prev, exerciseName]
        );
    }

    function handleSave() {
        if (!name.trim() || selectedExercises.length === 0) {
            alert("Please name your routine and select at least one exercise.");
            return;
        }
        if (editingRoutine) {
            onUpdateRoutine(editingRoutine.id, name.trim(), selectedExercises);
        } else {
            onCreateRoutine(name.trim(), selectedExercises);
        }
        setIsCreating(false);
        setEditingRoutine(null);
        setName("");
        setSelectedExercises([]);
        setQuery("");
    }

    function handleCancel() {
        setIsCreating(false);
        setEditingRoutine(null);
        setName("");
        setSelectedExercises([]);
        setQuery("");
    }

    const filteredNames = allExerciseNames.filter((n) =>
        n.toLowerCase().includes(query.toLowerCase())
    );

    if (isCreating || editingRoutine) {
        return (
            <div className="flex flex-col items-center gap-2 w-full max-w-md px-4">
                <p className="font-bold text-xl">{editingRoutine ? "Edit Routine" : "New Routine"}</p>
                <input
                    type="text"
                    placeholder="Routine name (e.g. Push Day)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="border rounded-md px-3 py-2 bg-transparent text-neutral-200 w-full"
                />
                <input
                    type="text"
                    placeholder="Search exercises..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="border rounded-md px-3 py-2 bg-transparent text-neutral-200 w-full"
                    autoComplete="off"
                />

                <p className="text-xs text-neutral-400 self-start">
                    {selectedExercises.length} selected
                </p>

                <div className="flex flex-wrap justify-center gap-2 max-h-64 overflow-y-auto w-full">
                    {filteredNames.map((exerciseName) => (
                        <button
                            key={exerciseName}
                            type="button"
                            onClick={() => toggleExercise(exerciseName)}
                            className={`px-3 py-2 border rounded-md text-sm ${
                                selectedExercises.includes(exerciseName)
                                    ? "bg-neutral-500 border-neutral-400"
                                    : "border-neutral-600"
                            }`}
                        >
                            {exerciseName}
                        </button>
                    ))}
                </div>

                <div className="flex gap-2 mt-2">
                    <button
                        onClick={handleSave}
                        className="border rounded-md px-4 py-2 font-bold bg-green-700"
                    >
                        {editingRoutine ? "Save Changes" : "Save Routine"}
                    </button>
                    <button
                        onClick={handleCancel}
                        className="border rounded-md px-4 py-2"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-2 w-full max-w-md px-4">
            <p className="font-bold text-xl">Routines</p>

            {routines.length === 0 && (
                <p className="text-neutral-400 text-sm text-center py-2">
                    No routines yet — create one to log a whole workout in one tap.
                </p>
            )}

            <div className="flex flex-col gap-2 w-full">
                {routines.map((r) => (
                    <div key={r.id} className="flex items-center gap-2 border-b border-neutral-700 py-2">
                        <button
                            onClick={() => onStartRoutine(r)}
                            className="flex-1 text-left"
                        >
                            <p className="font-bold">{r.name}</p>
                            <p className="text-xs text-neutral-400">{r.exerciseNames.length} exercises</p>
                        </button>
                        <button
                            onClick={() => startEditing(r)}
                            className="text-blue-400 text-xs px-2"
                        >
                            Edit
                        </button>
                        <button
                            onClick={() => onDeleteRoutine(r.id)}
                            className="text-red-400 text-xs px-2"
                        >
                            Delete
                        </button>
                    </div>
                ))}
            </div>

            <button
                onClick={startCreating}
                className="border rounded-md px-4 py-2 font-bold bg-green-700 mt-2"
            >
                + New Routine
            </button>

            <button className="mt-4 size-16 border" onClick={onBack}>
                🔙 Return
            </button>
        </div>
    );
}