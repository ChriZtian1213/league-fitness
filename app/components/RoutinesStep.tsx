import { useEffect, useState } from "react";import {
    DndContext,
    closestCenter,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
    arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { RoutineEntry } from "~/server/routine.server";
import type {LoggingType} from "~/types/exercise";
import type {Category, Muscle} from "~/types/workout";
import {CreateExerciseForm} from "~/components/CreateExerciseForm";

type CatalogEntry = {
    exercise: string;
    category: Category | null;
};

type Props = {
    routines: RoutineEntry[];
    exerciseCatalog: CatalogEntry[];
    editRoutineId?: string | null;
    onStartRoutine: (routine: RoutineEntry) => void;
    onCreateRoutine: (name: string, exerciseNames: string[]) => void;
    onUpdateRoutine: (routineId: string, name: string, exerciseNames: string[]) => void;
    onDeleteRoutine: (routineId: string) => void;
    onBack: () => void;
    onReorderRoutines: (orderedRoutineIds: string[]) => void;
    onCreateExercise: (
        name: string,
        category: Category,
        muscle: Muscle | undefined,
        loggingTypes: LoggingType[]
    ) => void;
}

function SortableRoutineRow({
                                routine,
                                onStartRoutine,
                                onStartEditing,
                                onDeleteRoutine,
                            }: {
    routine: RoutineEntry;
    onStartRoutine: (r: RoutineEntry) => void;
    onStartEditing: (r: RoutineEntry) => void;
    onDeleteRoutine: (id: string) => void;
}) {
    const {attributes, listeners, setNodeRef, transform, transition, isDragging} = useSortable({id: routine.id});

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center gap-2 border-b border-neutral-700 py-2 bg-gray-800"
        >
            <div
                {...attributes}
                {...listeners}
                className="text-neutral-500 px-2 cursor-grab active:cursor-grabbing touch-none"
            >
                ⠿
            </div>
            <button
                onClick={() => onStartRoutine(routine)}
                className="flex-1 text-left"
            >
                <p className="font-bold">{routine.name}</p>
                <p className="text-xs text-neutral-400">{routine.exerciseNames.length} exercises</p>
            </button>
            <button
                onClick={() => onStartEditing(routine)}
                className="text-blue-400 text-xs px-2"
            >
                Edit
            </button>
            <button
                onClick={() => onDeleteRoutine(routine.id)}
                className="text-red-400 text-xs px-2"
            >
                Delete
            </button>
        </div>
    );
}

export function RoutinesStep({routines, exerciseCatalog, onReorderRoutines, editRoutineId, onStartRoutine, onCreateExercise, onCreateRoutine, onUpdateRoutine, onDeleteRoutine, onBack}: Props) {
    const [editingRoutine, setEditingRoutine] = useState<RoutineEntry | null>(() => {
        if (editRoutineId) {
            return routines.find((r) => r.id === editRoutineId) ?? null;
        }
        return null;
    });
    const [isCreating, setIsCreating] = useState(false);
    const [isCreatingExercise, setIsCreatingExercise] = useState(false);
    const [name, setName] = useState(editingRoutine?.name ?? "");
    const [selectedExercises, setSelectedExercises] = useState<string[]>(editingRoutine?.exerciseNames ?? []);
    const [query, setQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<"all" | Category>("all");
    const [localRoutines, setLocalRoutines] = useState(routines);



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

    useEffect(() => {
        setLocalRoutines(routines);
    }, [routines]);

    const sensors = useSensors(
        useSensor(PointerSensor, {activationConstraint: {distance: 8}}),
        useSensor(TouchSensor, {activationConstraint: {delay: 150, tolerance: 5}})
    );

    function handleDragEnd(event: DragEndEvent) {
        const {active, over} = event;
        if (!over || active.id === over.id) return;

        const oldIndex = localRoutines.findIndex((r) => r.id === active.id);
        const newIndex = localRoutines.findIndex((r) => r.id === over.id);
        const reordered = arrayMove(localRoutines, oldIndex, newIndex);

        setLocalRoutines(reordered);
        onReorderRoutines(reordered.map((r) => r.id));
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



    const filteredExercises = exerciseCatalog
        .filter((c) => categoryFilter === "all" || c.category === categoryFilter)
        .filter((c) => c.exercise.toLowerCase().includes(query.toLowerCase()))
        .map((c) => c.exercise)
        .sort((a, b) => {
            const aSelected = selectedExercises.includes(a);
            const bSelected = selectedExercises.includes(b);
            if (aSelected && !bSelected) return -1;
            if (!aSelected && bSelected) return 1;
            return 0;
        });

    const matchOutsideFilter = query.trim() && filteredExercises.length === 0 && categoryFilter !== "all"
        ? exerciseCatalog.find((c) => c.exercise.toLowerCase().includes(query.toLowerCase()))
        : null;


    if (isCreatingExercise) {
        return (
            <div className="flex flex-col items-center gap-2 w-full max-w-md px-4">
                <CreateExerciseForm
                    initialName={query}
                    onCreate={(name, category, muscle, loggingTypes) => {
                        onCreateExercise(name, category, muscle, loggingTypes);

                        setSelectedExercises((previous) =>
                            previous.includes(name) ? previous : [...previous, name]
                        );

                        setQuery("");
                        setIsCreatingExercise(false);
                    }}
                    onCancel={() => setIsCreatingExercise(false)}
                />
            </div>
        );
    }

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

                <div className="flex border border-neutral-500 rounded-md overflow-hidden text-sm">
                    {(["all", "upper", "lower", "cardio"] as const).map((c) => (
                        <button
                            key={c}
                            type="button"
                            onClick={() => setCategoryFilter(c)}
                            className={`px-3 py-1.5 ${categoryFilter === c ? "bg-neutral-500" : ""}`}
                        >
                            {c === "all" ? "All" : c === "upper" ? "Upper" : c === "lower" ? "Lower" : "Cardio"}
                        </button>
                    ))}
                </div>

                <button
                    type="button"
                    onClick={() => {
                        setCategoryFilter("all");
                        setQuery("");
                    }}
                    className={`text-xs text-neutral-400 underline ${
                        categoryFilter === "all" && !query ? "invisible pointer-events-none" : ""
                    }`}
                >
                    Clear filters
                </button>

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
                    {filteredExercises.map((exerciseName) => (
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

                {filteredExercises.length === 0 && query.trim() && (
                    <div className="flex flex-col items-center gap-2">
                        {matchOutsideFilter ? (
                            <p className="text-xs text-neutral-400 text-center">
                                Found "{matchOutsideFilter.exercise}" in {matchOutsideFilter.category}.{" "}
                                <button
                                    type="button"
                                    onClick={() => setCategoryFilter("all")}
                                    className="text-blue-400 underline"
                                >
                                    Clear filter to see it
                                </button>
                            </p>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setIsCreatingExercise(true)}
                                className="border rounded-md px-4 py-2 text-sm"
                            >
                                + Create Exercise
                            </button>
                        )}
                    </div>
                )}

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

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={localRoutines.map((r) => r.id)} strategy={verticalListSortingStrategy}>
                    <div className="flex flex-col gap-2 w-full">
                        {localRoutines.map((r) => (
                            <SortableRoutineRow
                                key={r.id}
                                routine={r}
                                onStartRoutine={onStartRoutine}
                                onStartEditing={startEditing}
                                onDeleteRoutine={onDeleteRoutine}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

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