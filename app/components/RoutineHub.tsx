import { useEffect, useState } from "react";
import {
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
import type {RoutineEntry} from "~/server/routine.server";
import type {WorkoutEntry} from "~/types/workoutEntry";

type Props = {
    routine: RoutineEntry;
    workouts: WorkoutEntry[];
    todayDateStr: string;
    onSelectExercise: (exerciseName: string) => void;
    onEditRoutine: () => void;
    onHome: () => void;
    onReturnToRoutines: () => void;
    onReorderExercises: (exerciseNames: string[]) => void;
}

function toDateStr(date: Date) {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function SortableExerciseRow({
                                 exerciseName,
                                 isLogged,
                                 onSelectExercise,
                             }: {
    exerciseName: string;
    isLogged: boolean;
    onSelectExercise: (exerciseName: string) => void;
}) {
    const {attributes, listeners, setNodeRef, transform, transition, isDragging} = useSortable({id: exerciseName});

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center gap-2 border rounded-md bg-gray-800"
        >
            <div
                {...attributes}
                {...listeners}
                className="text-neutral-500 pl-3 py-3 cursor-grab active:cursor-grabbing touch-none"
            >
                ⠿
            </div>
            <button
                onClick={() => onSelectExercise(exerciseName)}
                className="flex-1 flex items-center justify-between pr-4 py-3 hover:bg-neutral-700 transition-colors rounded-r-md"
            >
                <span>{exerciseName}</span>
                {isLogged && <span className="text-green-400">✓</span>}
            </button>
        </div>
    );
}

export function RoutineHub({routine, workouts, todayDateStr, onSelectExercise, onEditRoutine, onHome, onReturnToRoutines, onReorderExercises}: Props) {
    const [localOrder, setLocalOrder] = useState(routine.exerciseNames);

    useEffect(() => {
        setLocalOrder(routine.exerciseNames);
    }, [routine.exerciseNames]);

    const loggedToday = new Set(
        workouts
            .filter((w) => toDateStr(w.createdAt) === todayDateStr)
            .map((w) => w.exercise)
    );

    const sensors = useSensors(
        useSensor(PointerSensor, {activationConstraint: {distance: 8}}),
        useSensor(TouchSensor, {activationConstraint: {delay: 150, tolerance: 5}})
    );

    function handleDragEnd(event: DragEndEvent) {
        const {active, over} = event;
        if (!over || active.id === over.id) return;

        const oldIndex = localOrder.indexOf(active.id as string);
        const newIndex = localOrder.indexOf(over.id as string);
        if (oldIndex === -1 || newIndex === -1) return;

        const reordered = arrayMove(localOrder, oldIndex, newIndex);
        setLocalOrder(reordered);
        onReorderExercises(reordered);
    }

    return (
        <div className="flex flex-col items-center gap-2 w-full max-w-md px-4">
            <p className="font-bold text-xl">{routine.name}</p>
            <p className="text-xs text-neutral-400">{routine.exerciseNames.length} exercises</p>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={localOrder} strategy={verticalListSortingStrategy}>
                    <div className="flex flex-col gap-2 w-full mt-2">
                        {localOrder.map((exerciseName) => (
                            <SortableExerciseRow
                                key={exerciseName}
                                exerciseName={exerciseName}
                                isLogged={loggedToday.has(exerciseName)}
                                onSelectExercise={onSelectExercise}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            <button
                onClick={onEditRoutine}
                className="text-sm text-blue-400 underline mt-2"
            >
                Edit Routine
            </button>

            <div className="flex flex-row">
                <button className="mt-4 size-16 border" onClick={onReturnToRoutines}>
                    🔙 Return
                </button>
                <button className="mt-4 size-16 border" onClick={onHome}>
                    Home
                </button>
            </div>
        </div>
    );
}