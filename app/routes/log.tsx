import type {Route} from "./+types/log"
import {useWorkoutFlow} from "~/features/workoutFlow/useWorkoutFlow";
import type {WorkoutEntry} from "~/types/workoutEntry";
import {useEffect, useState} from "react";
import type {Exercise} from "~/types/exercise";
import {CategoryStep} from "~/components/CategoryStep";
import {MuscleStep} from "~/components/MuscleStep";
import {ExerciseStep} from "~/components/ExerciseStep";
import {LogStep} from "~/components/LogStep";
import {NavBar} from "~/components/NavBar";
import {requireUserId} from "~/server/session.server";
import {useFetcher, useLoaderData} from "react-router";
import {createWorkoutEntry, getWorkoutsForUser, deleteWorkoutEntry, getAllExerciseNames} from "~/server/workout.server";

export async function loader({request}: Route.LoaderArgs){
    const userId = await requireUserId(request);
    const workouts = await getWorkoutsForUser(userId);
    const existingExerciseNames = await getAllExerciseNames();
    return {workouts, existingExerciseNames};
}

export async function action({request}: Route.ActionArgs){
    const userId = await requireUserId(request);
    const formData = await request.formData();

    const intent = formData.get("intent");

    if (intent === "delete"){
        const id = formData.get("id");
        if (typeof id !== "string" || !id){
            return {error: "Missing workout id."}
        }
        await deleteWorkoutEntry(userId, id);
        return {ok: true, deleteId: id};
    }

    const exercise = formData.get("exercise");
    const weight = formData.get("weight");
    const reps = formData.get("reps");
    const distance = formData.get("distance");
    const time = formData.get("time");
    const tempId = formData.get("tempId")

    if (typeof exercise !== "string" || !exercise) {
        return {error: "Missing exercise name."}
    }

    const workout = await createWorkoutEntry(userId, {
        exercise,
        weight: typeof weight === "string" && weight ? Number(weight) : undefined,
        reps: typeof reps === "string" && reps ? Number(reps) : undefined,
        distance: typeof distance === "string" && distance ? Number(distance) : undefined,
        time: typeof time === "string" && time ? time : undefined,
    });

    return {ok: true, workout, tempId: typeof tempId === "string" ? tempId : undefined};
}

export default function Log(){
    const {workouts: initialWorkouts, existingExerciseNames} = useLoaderData<typeof loader>();
    const fetcher = useFetcher();
    const flow = useWorkoutFlow()
    const [workouts, setWorkouts] = useState<WorkoutEntry[]>(initialWorkouts)
    const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
    const [exercises, setExercises] = useState<Exercise[]>([
        {
            id: "1",
            name: "Barbell Bench Press",
            category: "upper",
            muscle: "chest"
        },
        {
            id: "2",
            name: "Tricep Push Down",
            category: "upper",
            muscle: "triceps"
        },
        {
            id: "3",
            name: "Shoulder Press",
            category: "upper",
            muscle: "shoulders"
        },
        {
            id: "4",
            name: "Curl",
            category: "upper",
            muscle: "biceps"
        },
        {
            id: "5",
            name: "Hip Thrust",
            category: "lower",
            muscle: "glutes"
        },
        {
            id: "6",
            name: "Leg Curl",
            category: "lower",
            muscle: "hamstrings"
        },
        {
            id: "7",
            name: "Leg Extension",
            category: "lower",
            muscle: "quads"
        },
        {
            id: "8",
            name: "Calve Raise",
            category: "lower",
            muscle: "calves"
        },
        {
            id: "9",
            name: "Run",
            category: "cardio",
        },


    ])

    useEffect(() => {
        if (!fetcher.data) return;

        if (fetcher.data.workout && fetcher.data.tempId){
            setWorkouts((prev) =>
            prev.map((w) =>
            w.id === fetcher.data.tempId ? fetcher.data.workout : w
                )
            );
        }
    }, [fetcher.data]);


    function addWorkout(workout: WorkoutEntry) {
        setWorkouts((prev) => [workout, ...prev])
        const formData = new FormData();
        formData.set("exercise", workout.exercise);
        formData.set("tempId", workout.id);
        if (workout.weight !== undefined) formData.set("weight", String(workout.weight));
        if (workout.reps !== undefined) formData.set("reps", String(workout.reps));
        if (workout.distance !== undefined) formData.set("distance", String(workout.distance));
        if (workout.time !== undefined) formData.set("time", workout.time);

        fetcher.submit(formData, {method: "post"});
    }

    function deleteWorkout(id: string){
        setWorkouts((prev) => prev.filter((w) => w.id !== id));

        const formData = new FormData();
        formData.set("intent", "delete");
        formData.set("id", id);

        fetcher.submit(formData, {method: "post"});
    }

    return (
        <div className="min-h-screen bg-gray-800 text-neutral-200 pb-24">
            <div className="font-bold text-4xl flex justify-center items-center p-3">
                League Fitness
            </div>
            <div>
                <div className="flex flex-col items-center">
                    {flow.step === "category" && (
                        <CategoryStep
                            onSelect={(c) => {
                                flow.setCategory(c)
                                flow.setMuscle(null)
                                setSelectedExercise(null)
                                flow.next(c)
                                console.log(flow.step, flow.category, flow.muscle, selectedExercise)
                            }}
                        />
                    )}

                    {flow.step === "muscle" && flow.category && (
                        <MuscleStep
                            onSelect={(m) => {
                                flow.setMuscle(m);
                                flow.next();
                            }}
                            onBack={flow.back}
                            category={flow.category}
                        />
                    )}

                    {flow.step === "exercise" && flow.category && (
                        <ExerciseStep
                            category={flow.category}
                            muscle={flow.muscle}
                            exercises={exercises}
                            existingExerciseNames={existingExerciseNames}
                            onSelectExercise={(exercise) => {
                                setSelectedExercise(exercise)
                                flow.next()
                            }}
                            onCreateExercise={(name) => {
                                if (!flow.category ) return

                                const newExercise: Exercise = {
                                    id: crypto.randomUUID(),
                                    name,
                                    category: flow.category,
                                    muscle: flow.muscle ?? undefined
                                }

                                setExercises((prev) => [...prev, newExercise])
                                setSelectedExercise(newExercise)
                                flow.next()
                            }}
                            onBack={flow.back}
                            onHome={
                                flow.category !=="cardio"
                                    ? () => {
                                        setSelectedExercise(null)
                                        flow.setCategory(null)
                                        flow.setMuscle(null)
                                        flow.setStep("category")
                                    } : undefined
                            }
                        />
                    )}

                    {flow.step === "log" && selectedExercise && (
                        <LogStep
                            exercise={selectedExercise}
                            onSubmit={addWorkout}
                            onBack={flow.back}
                            onHome={() => {
                                setSelectedExercise(null)
                                flow.setCategory(null)
                                flow.setMuscle(null)
                                flow.setStep("category")
                            }}
                        />
                    )}
                </div>



                <h2 className="font-bold mt-4">Recent Logs</h2>

                {workouts.map((workout) => (
                    <div key={workout.id} className={"flex justify-between items-center px-2"}>
                        <div>
                            {workout.exercise} — <span/>
                            {workout.weight && workout.reps
                                ? `${workout.weight} lbs × ${workout.reps}`
                                : `${workout.distance} mi in ${workout.time}`
                            }
                            {" — "}
                            {workout.createdAt.toDateString()}
                        </div>
                        <button
                            className="text-red-400 hover:text-red-300 px-2"
                            onClick={() => deleteWorkout(workout.id)}
                            aria-label={`Delete ${workout.exercise} log`}
                        >
                            X
                            </button>
                    </div>
                ))}
            </div>
            <NavBar/>
        </div>
    )
}
