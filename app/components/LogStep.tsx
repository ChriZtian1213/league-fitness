import { useState, useRef } from "react"
import type { Exercise } from "../types/exercise.ts";
import type {WorkoutEntry} from "../types/workoutEntry.ts";

type Props = {
    exercise: Exercise
    personalBest: WorkoutEntry | null
    onSubmit: (workout: WorkoutEntry) => void
    onBack: () => void
    onHome: () => void
}

function formatBest(best: WorkoutEntry): string {
    if (best.weight !== undefined && best.reps !== undefined) {
        return `${best.weight} lbs × ${best.reps}`;
    }
    return `${best.distance} mi in ${best.time}`;
}

export function LogStep({exercise, onSubmit, onBack, onHome, personalBest}: Props) {
    const [weight, setWeight] = useState("");
    const [reps, setReps] = useState("");

    const [distance, setDistance] = useState("");
    const [time, setTime] = useState("");

    const weightInputRef = useRef<HTMLInputElement>(null);
    const repsInputRef = useRef<HTMLInputElement>(null);
    const distanceInputRef = useRef<HTMLInputElement>(null);
    const timeInputRef = useRef<HTMLInputElement>(null);

    const validTime = /^\d+:\d{2}$/.test(time)

    function handleWeightKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter") {
            e.preventDefault();
            repsInputRef.current?.focus();
        }
    }

    function handleDistanceKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter") {
            e.preventDefault();
            timeInputRef.current?.focus();
        }
    }

    function normalizeTime(input: string){
        const trimmed = input.trim();
        if (/^\d+$/.test(trimmed)) {
            return `${trimmed}:00`;
        }

        if (/^\d+:\d{2}$/.test(trimmed)) {
            return trimmed;
        }

        return null;
    }

    function handleSubmit(): boolean {
        const normalizedTime = normalizeTime(time);

        if (exercise.category === "cardio"){
            const distanceNumber = Number(distance);
            if (!distance || !time){
                alert("Please fill in all fields");
                return false;
            }
            if (distanceNumber <= 0){
                alert("Distance must be greater than 0");
                return false;
            }
            if (!normalizedTime){
                alert("Time must be mm or mm:ss");
                return false;
            }

            const workout: WorkoutEntry = {
                id: crypto.randomUUID(),
                exercise: exercise.name,
                category: exercise.category,
                muscle: exercise.muscle,
                distance: Number(distance),
                time: normalizedTime,
                createdAt: new Date()
            }

            onSubmit(workout);

            setDistance("");
            setTime("");
            return true;

        } else {
            const weightNumber = Number(weight);
            const repsNumber = Number(reps);

            if (!weight || !reps){
                alert("Please fill in all fields")
                return false
            }

            if (weightNumber <= 0 || repsNumber <= 0){
                alert("Weight and reps must be greater than 0");
                return false;
            }

            const workout: WorkoutEntry = {
                id: crypto.randomUUID(),
                exercise: exercise.name,
                category: exercise.category,
                muscle: exercise.muscle,
                weight: Number(weight),
                reps: Number(reps),
                createdAt: new Date()
            }

            onSubmit(workout);

            setWeight("")
            setReps("")
            return true;
        }
    }

    function handleRepsKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter") {
            e.preventDefault();
            if (handleSubmit()) {
                weightInputRef.current?.focus();
            }
        }
    }

    function handleTimeKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter") {
            e.preventDefault();
            if (handleSubmit()) {
                weightInputRef.current?.focus();
            }
        }
    }

    const inputClass = "border rounded-md px-3 py-2 bg-transparent text-neutral-200 w-32 text-center";

    return (
        <div className={"flex flex-col items-center gap-2"}>

            <h2 className={"text-xl font-bold"}>{exercise.name}</h2>

            {personalBest && (
                <p className="text-sm text-yellow-400 text-center">
                    🏆 Personal best: {formatBest(personalBest)}
                </p>
            )}

            {exercise.category === "cardio" ? (
                <div className="flex gap-2">
                    <input
                        ref={distanceInputRef}
                        type="number"
                        placeholder="Distance (mi)"
                        value={distance}
                        onChange={(e) => setDistance(e.target.value)}
                        onKeyDown={handleDistanceKeyDown}
                        className={inputClass}
                    />

                    <input
                        ref={timeInputRef}
                        type="text"
                        placeholder="Time (mm:ss)"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        onKeyDown={handleTimeKeyDown}
                        className={inputClass}
                    />
                </div>
            ) : (
                <div className="flex gap-2 items-center">
                    <input
                        ref={weightInputRef}
                        type="number"
                        placeholder="Weight (lbs)"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        onKeyDown={handleWeightKeyDown}
                        className={inputClass}
                    />

                    <p className="font-bold">x</p>

                    <input
                        ref={repsInputRef}
                        type="number"
                        placeholder="Reps"
                        value={reps}
                        onChange={(e) => setReps(e.target.value)}
                        onKeyDown={handleRepsKeyDown}
                        className={inputClass}
                    />
                </div>
            )}

            <button
                className={"size-24 border bg-green-700"}
                onClick={handleSubmit}>
                Save Workout
            </button>

            <div className="flex flex-row">
                <button
                    className={"mt-4 size-16 border"}
                    onClick={onBack}>
                    🔙 Return
                </button>
                <button
                    className="mt-4 size-16 border"
                    onClick={onHome}
                >
                    Home
                </button>
            </div>
        </div>
    )
}