import { useState, useRef } from "react"
import type { Exercise } from "../types/exercise.ts";
import type {WorkoutEntry} from "../types/workoutEntry.ts";

type Props = {
    exercise: Exercise
    onSubmit: (workout: WorkoutEntry) => void
    onBack: () => void
    onHome: () => void
}

export function LogStep({exercise, onSubmit, onBack, onHome}: Props) {
    const [weight, setWeight] = useState("");
    const [reps, setReps] = useState("");

    const [distance, setDistance] = useState("");
    const [time, setTime] = useState("");

    const weightInputRef = useRef<HTMLInputElement>(null);
    const distanceInputRef = useRef<HTMLInputElement>(null);

    const validTime = /^\d+:\d{2}$/.test(time)

    function normalizeTime(input: string){
        const trimmed = input.trim();
        if (/^\d+$/.test(trimmed)) {
            return `${trimmed}:00`;
        }

        // If format is mm:ss
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


    return (
        <div className={"flex flex-col gap-2"}>

            <h2 className={"text-2xl font-bold"}>{exercise.name}</h2>

            {exercise.category === "cardio" ? (
                <div className="flex gap-2">
                    <input
                        ref={distanceInputRef}
                        type="number"
                        placeholder="Distance (miles)"
                        value={distance}
                        onChange={(e) => setDistance(e.target.value)}
                    />

                    <input
                        type="text"
                        placeholder="Time (mm:ss)"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        onKeyDown={handleTimeKeyDown}
                    />
                </div>
            ) : (
                <div className="flex gap-2">
                    <input
                        ref={weightInputRef}
                        type="number"
                        placeholder="Weight (lbs)"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                    />

                    <p>x</p>

                    <input
                        type="number"
                        placeholder="Reps"
                        value={reps}
                        onChange={(e) => setReps(e.target.value)}
                        onKeyDown={handleRepsKeyDown}
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