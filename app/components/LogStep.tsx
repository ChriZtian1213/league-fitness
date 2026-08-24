import { useState } from "react"
import type { Exercise } from "../types/exercise.ts";
import type {WorkoutEntry} from "../types/workoutEntry.ts";

type Props = {
    exercise: Exercise
    onSubmit: (workout: WorkoutEntry) => void
    onBack: () => void
}

export function LogStep({exercise, onSubmit, onBack}: Props) {
    const [weight, setWeight] = useState("");
    const [reps, setReps] = useState("");

    function handleSubmit(){
        const weightNumber = Number(weight);
        const repsNumber = Number(reps);

        if (!weight || !reps){
            alert("Please fill in all fields")
            return
        }

        if (weightNumber <= 0 || repsNumber <= 0){
            alert("Weight and reps must be greater than 0");
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
    }

    return (
        <div>
            <h2>{exercise.name}</h2>

            <input
                type ="number"
                placeholder="Weight (lbs.)"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}

            >
            </input>


            <input
                type="number"
                placeholder="Reps"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
            />

            <button onClick={handleSubmit}>
                Save Workout
            </button>

            <button onClick={onBack}>
                Back
            </button>
        </div>
    )
}