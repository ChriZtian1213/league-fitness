import type {Route} from "./+types/log"
import {useWorkoutFlow} from "~/features/workoutFlow/useWorkoutFlow";
import type {WorkoutEntry} from "~/types/workoutEntry";
import {useState} from "react";
import type {Exercise} from "~/types/exercise";
import {CategoryStep} from "~/components/CategoryStep";
import {MuscleStep} from "~/components/MuscleStep";
import {ExerciseStep} from "~/components/ExerciseStep";
import {LogStep} from "~/components/LogStep";
import {NavBar} from "~/components/NavBar";
import {WorkoutCalendar} from "~/components/WorkoutCalendar";
import {requireUserId} from "~/server/session.server";
import {useFetcher, useLoaderData} from "react-router";
import {createWorkoutEntry, getWorkoutsForUser, deleteWorkoutEntry, getExerciseCatalog, getWorkoutDatesForUser} from "~/server/workout.server";

function toDateStr(date: Date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

export async function loader({request}: Route.LoaderArgs){
    const userId = await requireUserId(request);
    const workouts = await getWorkoutsForUser(userId);
    const exerciseCatalog = await getExerciseCatalog();
    const loggedDates = await getWorkoutDatesForUser(userId);

    const url = new URL(request.url);
    const now = new Date();
    const year = Number(url.searchParams.get("year")) || now.getFullYear();
    const month = Number(url.searchParams.get("month")) || now.getMonth() + 1;
    const date = url.searchParams.get("date") ?? toDateStr(now);

    return {workouts, exerciseCatalog, loggedDates, year, month, date};
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
        return {ok: true, deletedId: id};
    }

    const exercise = formData.get("exercise");
    const category = formData.get("category");
    const muscle = formData.get("muscle");
    const weight = formData.get("weight");
    const reps = formData.get("reps");
    const distance = formData.get("distance");
    const time = formData.get("time");
    const tempId = formData.get("tempId");

    if (typeof exercise !== "string" || !exercise) {
        return {error: "Missing exercise name."}
    }
    if (typeof category !== "string") {
        return {error: "Missing category."}
    }

    const workout = await createWorkoutEntry(userId, {
        exercise,
        category: category as any, // matches your Category type
        muscle: typeof muscle === "string" ? (muscle as any) : undefined,
        weight: typeof weight === "string" && weight ? Number(weight) : undefined,
        reps: typeof reps === "string" && reps ? Number(reps) : undefined,
        distance: typeof distance === "string" && distance ? Number(distance) : undefined,
        time: typeof time === "string" && time ? time : undefined,
    });

    return {ok: true, workout, tempId: typeof tempId === "string" ? tempId : undefined};
}

function formatLine(w: WorkoutEntry) {
    return w.weight && w.reps
        ? `${w.weight} lbs × ${w.reps}`
        : `${w.distance} mi in ${w.time}`;
}

// "Best" set within a same-day, same-exercise group: highest weight, then
// highest reps as a tiebreaker. Cardio entries (no weight) fall back to
// longest distance.
function pickBest(entries: WorkoutEntry[]): WorkoutEntry {
    return entries.reduce((best, curr) => {
        if (best.weight !== undefined && curr.weight !== undefined) {
            if (curr.weight !== best.weight) return curr.weight > best.weight ? curr : best;
            return (curr.reps ?? 0) > (best.reps ?? 0) ? curr : best;
        }
        if (best.distance !== undefined && curr.distance !== undefined) {
            return curr.distance > best.distance ? curr : best;
        }
        return best;
    });
}

export default function Log(){
    const {workouts: initialWorkouts, exerciseCatalog, loggedDates, year, month, date} = useLoaderData<typeof loader>();
    const fetcher = useFetcher();
    const flow = useWorkoutFlow()
    const [workouts, setWorkouts] = useState<WorkoutEntry[]>(initialWorkouts)
    const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
    const [expandedExercises, setExpandedExercises] = useState<Set<string>>(new Set())
    const [exercises, setExercises] = useState<Exercise[]>([
        {id: "1", name: "Barbell Bench Press", category: "upper", muscle: "chest"},
        {id: "2", name: "Tricep Push Down", category: "upper", muscle: "triceps"},
        {id: "3", name: "Shoulder Press", category: "upper", muscle: "shoulders"},
        {id: "4", name: "Curl", category: "upper", muscle: "biceps"},
        {id: "5", name: "Hip Thrust", category: "lower", muscle: "glutes"},
        {id: "6", name: "Leg Curl", category: "lower", muscle: "hamstrings"},
        {id: "7", name: "Leg Extension", category: "lower", muscle: "quads"},
        {id: "8", name: "Calve Raise", category: "lower", muscle: "calves"},
        {id: "9", name: "Run", category: "cardio"},
    ])

    function addWorkout(workout: WorkoutEntry) {
        setWorkouts((prev) => [workout, ...prev])
        const formData = new FormData();
        formData.set("exercise", workout.exercise);
        formData.set("category", workout.category);
        if (workout.muscle) formData.set("muscle", workout.muscle);
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

    function toggleExpanded(exerciseName: string) {
        setExpandedExercises((prev) => {
            const next = new Set(prev);
            if (next.has(exerciseName)) next.delete(exerciseName);
            else next.add(exerciseName);
            return next;
        });
    }

    // Group the selected day's workouts by exercise name, keeping the best
    // set per exercise plus the full list for the "show all" expansion.
    const dayWorkouts = workouts.filter((w) => toDateStr(w.createdAt) === date);
    const groupedByExercise = new Map<string, WorkoutEntry[]>();
    for (const w of dayWorkouts) {
        const group = groupedByExercise.get(w.exercise) ?? [];
        group.push(w);
        groupedByExercise.set(w.exercise, group);
    }

    const existingExerciseNames = exerciseCatalog
        .filter((c) => {
            if (flow.category && c.category !== flow.category) return false;
            if (flow.muscle && c.muscle !== flow.muscle) return false;
            return true;
        })
        .map((c) => c.exercise);

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
                            }}
                        />
                    )}

                    {flow.step === "muscle" && flow.category && (
                        <MuscleStep
                            onSelect={(m) => { flow.setMuscle(m); flow.next(); }}
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
                                if (!flow.category) return
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
                                flow.category !== "cardio"
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

                <div className="py-4">
                    <WorkoutCalendar year={year} month={month} loggedDates={loggedDates} selectedDate={date} />
                </div>

                <h2 className="font-bold mt-4 px-4">
                    {date === toDateStr(new Date()) ? "Today's Logs" : `Logs for ${date}`}
                </h2>

                {groupedByExercise.size === 0 && (
                    <p className="px-4 py-4 text-neutral-400">No workouts logged this day.</p>
                )}

                {Array.from(groupedByExercise.entries()).map(([exerciseName, entries]) => {
                    const best = pickBest(entries);
                    const isExpanded = expandedExercises.has(exerciseName);

                    return (
                        <div key={exerciseName} className="px-4 py-2 border-b border-neutral-700">
                            <div className="flex justify-between items-center">
                                <div>
                                    {exerciseName} — {formatLine(best)}
                                    {" — "}{best.createdAt.toDateString()}
                                </div>
                                <button
                                    className="text-red-400 px-2"
                                    onClick={() => deleteWorkout(best.id)}
                                    aria-label={`Delete ${exerciseName} log`}
                                >
                                    X
                                </button>
                            </div>

                            {entries.length > 1 && (
                                <button
                                    className="text-xs text-blue-400 mt-1"
                                    onClick={() => toggleExpanded(exerciseName)}
                                >
                                    {isExpanded ? "Hide all sets" : `Show all ${entries.length} sets`}
                                </button>
                            )}

                            {isExpanded && (
                                <div className="mt-2 flex flex-col gap-1 pl-4">
                                    {entries.map((w) => (
                                        <div key={w.id} className="flex justify-between items-center text-sm">
                                            <div>{formatLine(w)}{w.id === best.id ? " ⭐" : ""}</div>
                                            <button
                                                className="text-red-400 px-2"
                                                onClick={() => deleteWorkout(w.id)}
                                                aria-label={`Delete this set`}
                                            >
                                                X
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            <NavBar/>
        </div>
    )
}