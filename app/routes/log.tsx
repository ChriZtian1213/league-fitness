import type {Route} from "./+types/log"
import {useEffect, useState} from "react";
import {useNavigate} from "react-router";
import {useWorkoutFlow} from "~/features/workoutFlow/useWorkoutFlow";
import type {WorkoutEntry} from "~/types/workoutEntry";
import type {Exercise, LoggingType} from "~/types/exercise";
import {CategoryStep} from "~/components/CategoryStep";
import {MuscleStep} from "~/components/MuscleStep";
import {ExerciseStep} from "~/components/ExerciseStep";
import {LogStep} from "~/components/LogStep";
import {NavBar} from "~/components/NavBar";
import {WorkoutCalendar} from "~/components/WorkoutCalendar";
import { useFetcher, useLoaderData} from "react-router";
import {createWorkoutEntry, getWorkoutsForUser, deleteWorkoutEntry, getExerciseCatalog, getWorkoutDatesForUser, getAllExerciseNames} from "~/server/workout.server";
import {requireUserId} from "~/server/session.server";
import {getUserById} from "~/server/user.server"
import {useLocalToday} from "~/hooks/useLocalToday";
import {createRoutine, deleteRoutine, getRoutinesForUser, updateRoutine} from "~/server/routine.server";
import {RoutinesStep} from "~/components/RoutinesStep";
import {RoutineHub} from "~/components/RoutineHub";

function toDateStr(date: Date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

export async function loader({request}: Route.LoaderArgs){
    const userId = await requireUserId(request);

    const cookieHeader = request.headers.get("Cookie") ?? "";
    const timezoneMatch = cookieHeader.match(/(?:^|;\s*)timezone=([^;]*)/);

    const timezone = timezoneMatch
        ? decodeURIComponent(timezoneMatch[1])
        : "UTC";

    const user = await getUserById(userId);
    const workouts = await getWorkoutsForUser(userId);
    const exerciseCatalog = await getExerciseCatalog();
    const loggedDates = await getWorkoutDatesForUser(userId, timezone);
    const routines = await getRoutinesForUser(userId);
    const allExerciseNames = await getAllExerciseNames();

    const url = new URL(request.url);
    const now = new Date();
    const todayDateStr = toDateStr(now);
    const year = Number(url.searchParams.get("year")) || now.getFullYear();
    const month = Number(url.searchParams.get("month")) || now.getMonth() + 1;
    const date = url.searchParams.get("date") ?? todayDateStr;

    return {
        user,
        workouts,
        exerciseCatalog,
        loggedDates,
        year,
        month,
        date,
        todayDateStr,
        routines,
        allExerciseNames
    };
}

export async function action({request}: Route.ActionArgs){
    const userId = await requireUserId(request);
    const formData = await request.formData();
    const tempId = formData.get("tempId");

    const intent = formData.get("intent");
    if (intent === "createRoutine") {
        const name = formData.get("name");
        const exerciseNames = formData.getAll("exerciseNames");
        if (typeof name === "string" && name.trim() && exerciseNames.length > 0) {
            await createRoutine(userId, name.trim(), exerciseNames as string[]);
        }
        return {ok: true};
    }

    if (intent === "deleteRoutine") {
        const routineId = formData.get("routineId");
        if (typeof routineId === "string") {
            await deleteRoutine(userId, routineId);
        }
        return {ok: true};
    }

    if (intent === "updateRoutine") {
        const routineId = formData.get("routineId");
        const name = formData.get("name");
        const exerciseNames = formData.getAll("exerciseNames");
        if (typeof routineId === "string" && typeof name === "string" && name.trim() && exerciseNames.length > 0) {
            await updateRoutine(userId, routineId, name.trim(), exerciseNames as string[]);
        }
        return {ok: true};
    }

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
    const steps = formData.get("steps");
    const loggingType = formData.get("loggingType");

    if (typeof exercise !== "string" || !exercise) {
        return {error: "Missing exercise name."}
    }
    if (typeof category !== "string") {
        return {error: "Missing category."}
    }

    const workout = await createWorkoutEntry(userId, {
        exercise,
        category: category as any,
        muscle: typeof muscle === "string" ? (muscle as any) : undefined,
        weight: typeof weight === "string" && weight ? Number(weight) : undefined,
        reps: typeof reps === "string" && reps ? Number(reps) : undefined,
        distance: typeof distance === "string" && distance ? Number(distance) : undefined,
        time: typeof time === "string" && time ? time : undefined,
        steps: typeof steps === "string" && steps ? Number(steps) : undefined,
        loggingType: typeof loggingType === "string"
            ? (loggingType as LoggingType)
            : undefined,
    });

    return {ok: true, workout, tempId: typeof tempId === "string" ? tempId : undefined};
}

function formatLine(w: WorkoutEntry) {
    if (w.loggingType === "timed") {
        return `${w.time}`;
    }
    if (w.exercise === "Stair Master" && w.steps != null) {
        return `${w.steps} steps in ${w.time}`;
    }
    if (w.loggingType === "bodyweight") {
        return w.weight ? `${w.weight} lbs × ${w.reps} reps` : `${w.reps} reps`;
    }
    if (w.steps != null) {
        return `${w.steps} steps`;
    }
    return w.weight && w.reps
        ? `${w.weight} lbs × ${w.reps}`
        : `${w.distance} mi in ${w.time}`;
}

function pickBestForExercise(workouts: WorkoutEntry[], exerciseName: string): WorkoutEntry | null {
    const matching = workouts.filter((w) => w.exercise === exerciseName);
    if (matching.length === 0) return null;
    return pickBest(matching);
}

function pickBest(entries: WorkoutEntry[]): WorkoutEntry {
    return entries.reduce((best, curr) => {
        if (best.loggingType === "bodyweight" && curr.loggingType === "bodyweight") {
            return (curr.reps ?? 0) > (best.reps ?? 0) ? curr : best;
        }
        if (best.weight != null && curr.weight != null) {
            if (curr.weight !== best.weight) return curr.weight > best.weight ? curr : best;
            return (curr.reps ?? 0) > (best.reps ?? 0) ? curr : best;
        }
        if (best.steps != null && curr.steps != null) {
            return curr.steps > best.steps ? curr : best;
        }
        if (best.distance != null && curr.distance != null) {
            return curr.distance > best.distance ? curr : best;
        }
        return best;
    });
}

export default function Log(){
    const {workouts: initialWorkouts, exerciseCatalog, loggedDates, year, month, date, todayDateStr, routines, allExerciseNames} = useLoaderData<typeof loader>();    const clientToday = useLocalToday(todayDateStr);
    const navigate = useNavigate();
    const fetcher = useFetcher();
    const flow = useWorkoutFlow()
    const [showCalendar, setShowCalendar] = useState(date !== clientToday);
    const [pendingReturnToHub, setPendingReturnToHub] = useState(false);
    const [workouts, setWorkouts] = useState<WorkoutEntry[]>(initialWorkouts)
    const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
    const [expandedExercises, setExpandedExercises] = useState<Set<string>>(new Set())
    const [exercises, setExercises] = useState<Exercise[]>(() =>
        exerciseCatalog
            .filter((c) => c.category)
            .map((c) => ({
                id: `catalog-${c.category}-${c.muscle ?? "none"}-${c.exercise}`,
                name: c.exercise,
                category: c.category as Exercise["category"],
                muscle: c.muscle ?? undefined,
                loggingType: c.loggingType,
                allowedLoggingTypes: c.allowedLoggingTypes,
            }))
    );

    useEffect(() => {
        const url = new URL(window.location.href);
        const hasDateParam = url.searchParams.has("date");

        if (!hasDateParam && clientToday !== date) {
            const [y, m] = clientToday.split("-");
            navigate(`?year=${y}&month=${Number(m)}&date=${clientToday}`, {replace: true});
        }
    }, [clientToday]);

    useEffect(() => {
        if (flow.activeRoutine) {
            const updated = routines.find((r) => r.id === flow.activeRoutine!.id);
            if (updated) {
                flow.setActiveRoutine(updated);
                if (pendingReturnToHub) {
                    flow.returnToRoutineHub();
                    setPendingReturnToHub(false);
                }
            }
        }
    }, [routines]);

    useEffect(() => {
        if (fetcher.data?.error && fetcher.data?.tempId) {
            setWorkouts((prev) => prev.filter((w) => w.id !== fetcher.data.tempId));
        }



        if (fetcher.data?.workout && fetcher.data?.tempId) {
            setWorkouts((prev) =>
                prev.map((w) => (w.id === fetcher.data.tempId ? fetcher.data.workout : w))
            );
        }
    }, [fetcher.data]);




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
        if (workout.steps !== undefined) formData.set("steps", String(workout.steps));
        if (workout.loggingType) formData.set("loggingType", workout.loggingType);
        fetcher.submit(formData, {method: "post"});
    }

    function Breadcrumb({flow}: {flow: ReturnType<typeof useWorkoutFlow>}) {
        if (flow.step === "category") return null;

        const parts: {label: string; onClick: () => void}[] = [];

        if (flow.category) {
            parts.push({
                label: flow.category === "upper" ? "Upper" : flow.category === "lower" ? "Lower" : "Cardio",
                onClick: () => flow.setStep("category"),
            });
        }

        if (flow.muscle && flow.step !== "muscle") {
            parts.push({
                label: flow.muscle.charAt(0).toUpperCase() + flow.muscle.slice(1),
                onClick: () => flow.setStep("muscle"),
            });
        }

        if (flow.step === "log" || flow.step === "exercise") {
            // current step, not clickable
        }

        return (
            <>
                {flow.activeRoutine && flow.step !== "routineHub" && flow.step !== "log" && (
                    <div className="flex items-center justify-center gap-2 text-xs text-neutral-400 mb-2">
                        <span>Adding to "{flow.activeRoutine.name}"</span>
                        <button onClick={() => flow.returnToRoutineHub()} className="underline text-blue-400">
                            Back to routine
                        </button>
                    </div>
                )}
                <div className="flex justify-center items-center gap-1 text-xs text-neutral-400 mb-2">
                    {parts.map((p, i) => (
                        <span key={i} className="flex items-center gap-1">
                    <button onClick={p.onClick} className="underline hover:text-neutral-200">
                        {p.label}
                    </button>
                    <span>›</span>
                </span>
                    ))}
                    <span className="text-neutral-200 font-bold capitalize">{flow.step}</span>
                </div>
            </>
        );
    }

    const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

    function deleteWorkout(id: string){
        if (deletingIds.has(id)) return; // already in progress, ignore extra clicks
        setDeletingIds((prev) => new Set(prev).add(id));

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
            {fetcher.data?.error && (
                <p className="text-red-400 text-center px-4 py-2">{fetcher.data.error}</p>
            )}
            <div>
                <div className="flex flex-col items-center">
                    <Breadcrumb flow={flow} />
                    {flow.step === "category" && (
                        <CategoryStep
                            onSelect={(c) => {
                                flow.setCategory(c)
                                flow.setMuscle(null)
                                setSelectedExercise(null)
                                flow.next(c)
                            }}
                            onSelectRoutines={() => flow.setStep("routines")}
                        />
                    )}

                    {flow.step === "routineHub" && (() => {
                        console.log("routineHub render check:", {
                            activeRoutine: flow.activeRoutine,
                            matchFound: flow.activeRoutine ? routines.some((r) => r.id === flow.activeRoutine!.id) : "no active routine",
                            routinesIds: routines.map((r) => r.id),
                        });
                        return null;
                    })()}

                    {flow.step === "routineHub" && (() => {
                        console.log("routineHub render check:", {
                            activeRoutine: flow.activeRoutine,
                            matchFound: flow.activeRoutine ? routines.some((r) => r.id === flow.activeRoutine!.id) : "no active routine",
                            routinesIds: routines.map((r) => r.id),
                        });
                        return null;
                    })()}

                    {flow.step === "routineHub" && flow.activeRoutine && routines.some((r) => r.id === flow.activeRoutine!.id) && (
                        <RoutineHub
                            routine={flow.activeRoutine}
                            workouts={workouts}
                            todayDateStr={todayDateStr}
                            onSelectExercise={(exerciseName) => {
                                const ex = exercises.find((e) => e.name === exerciseName);
                                if (ex) {
                                    setSelectedExercise(ex);
                                    flow.setStep("log");
                                }
                            }}
                            onEditRoutine={() => flow.startEditingActiveRoutine()}
                            onReturnToRoutines={() => {
                                flow.setEditIntent(false);
                                flow.setActiveRoutine(null);
                                flow.returnToRoutines();
                            }}
                            onHome={() => flow.exitRoutine()}
                        />
                    )}

                    {flow.step === "routines" && (
                        <RoutinesStep
                            routines={routines}
                            allExerciseNames={allExerciseNames}
                            editRoutineId={flow.editIntent ? flow.activeRoutine?.id : undefined}
                            onStartRoutine={(routine) => {
                                flow.startRoutine(routine);
                            }}
                            onCreateRoutine={(name, exerciseNames) => {
                                const formData = new FormData();

                                formData.set("intent", "createRoutine");
                                formData.set("name", name);

                                exerciseNames.forEach((exerciseName) => {
                                    formData.append("exerciseNames", exerciseName);
                                });

                                fetcher.submit(formData, {method: "post"});
                            }}
                            onUpdateRoutine={(routineId, name, exerciseNames) => {
                                const formData = new FormData();
                                formData.set("intent", "updateRoutine");
                                formData.set("routineId", routineId);
                                formData.set("name", name);
                                exerciseNames.forEach((n) => formData.append("exerciseNames", n));
                                fetcher.submit(formData, {method: "post"});

                                flow.setActiveRoutine({id: routineId, name, exerciseNames});
                                flow.setEditIntent(false);
                                flow.returnToRoutineHub();
                            }}
                            onDeleteRoutine={(routineId) => {
                                // ...unchanged
                            }}
                            onBack={() => {
                                flow.setEditIntent(false);
                                flow.exitRoutine();
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
                            onCreateExercise={(name, loggingTypes) => {
                                if (!flow.category) return
                                const newExercise: Exercise = {
                                    id: crypto.randomUUID(),
                                    name,
                                    category: flow.category,
                                    muscle: flow.muscle ?? undefined,
                                    loggingType: flow.category === "cardio" ? undefined : loggingTypes[0],
                                    allowedLoggingTypes: flow.category === "cardio" ? undefined : loggingTypes,
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
                            personalBest={pickBestForExercise(workouts, selectedExercise.name)}
                            onSubmit={addWorkout}
                            onBack={() => {
                                if (flow.activeRoutine) {
                                    flow.returnToRoutineHub();
                                } else {
                                    flow.back();
                                }
                            }}
                            onHome={() => {
                                if (flow.activeRoutine) {
                                    flow.returnToRoutineHub();
                                } else {
                                    setSelectedExercise(null)
                                    flow.setCategory(null)
                                    flow.setMuscle(null)
                                    flow.setStep("category")
                                }
                            }}
                        />
                    )}
                </div>

                <div className="py-2 flex justify-center pt-8">
                    <button
                        onClick={() => setShowCalendar((v) => !v)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-neutral-500 text-neutral-300 text-sm font-bold hover:border-neutral-400 transition-colors"
                    >
                        📅 {showCalendar ? "Hide Calendar" : "View Calendar"}
                    </button>
                </div>

                {showCalendar && (
                    <div className="py-4">
                        <p className="text-xs text-neutral-500 text-center mb-2">
                            🟢 = logged workout — tap any day to view it
                        </p>
                        <WorkoutCalendar
                            year={year}
                            month={month}
                            loggedDates={loggedDates}
                            selectedDate={date}
                            today={clientToday}
                            dayLinkBase="?"
                        />
                    </div>
                )}

                <h2 className="font-bold mt-4 px-4">
                    {date === clientToday ? "Today's Logs" : `Logs for ${date}`}
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