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
}

function toDateStr(date: Date) {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function RoutineHub({routine, workouts, todayDateStr, onSelectExercise, onEditRoutine, onHome, onReturnToRoutines}: Props) {
    const loggedToday = new Set(
        workouts
            .filter((w) => toDateStr(w.createdAt) === todayDateStr)
            .map((w) => w.exercise)
    );

    return (
        <div className="flex flex-col items-center gap-2 w-full max-w-md px-4">
            <p className="font-bold text-xl">{routine.name}</p>
            <p className="text-xs text-neutral-400">{routine.exerciseNames.length} exercises</p>

            <div className="flex flex-col gap-2 w-full mt-2">
                {routine.exerciseNames.map((exerciseName) => {
                    const isLogged = loggedToday.has(exerciseName);
                    return (
                        <button
                            key={exerciseName}
                            onClick={() => onSelectExercise(exerciseName)}
                            className="flex items-center justify-between border rounded-md px-4 py-3 hover:bg-neutral-700 transition-colors"
                        >
                            <span>{exerciseName}</span>
                            {isLogged && <span className="text-green-400">✓</span>}
                        </button>
                    );
                })}
            </div>

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