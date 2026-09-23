import { useState } from "react";
import {WorkoutCalendar} from "~/components/WorkoutCalendar";
import { useWorkoutFlow } from "~/features/workoutFlow/useWorkoutFlow";
import { useGuestWorkouts } from "~/hooks/useGuestWorkouts";
import { CategoryStep } from "~/components/CategoryStep";
import { MuscleStep } from "~/components/MuscleStep";
import { ExerciseStep } from "~/components/ExerciseStep";
import { LogStep } from "~/components/LogStep";
import { NavBar } from "~/components/NavBar";
import { Link } from "react-router";
import type { Exercise } from "~/types/exercise";
import type { WorkoutEntry } from "~/types/workoutEntry";
import { formatLine, pickBest, pickBestForExercise } from "~/utils/formatWorkout";

export function GuestLog({exerciseCatalog, todayDateStr}: {exerciseCatalog: any[]; todayDateStr: string}) {
    const flow = useWorkoutFlow();
    const { workouts, addGuestWorkout, deleteGuestWorkout } = useGuestWorkouts();
    const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
    const [expandedExercises, setExpandedExercises] = useState<Set<string>>(new Set());
    const [showCalendar, setShowCalendar] = useState(false);

    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth() + 1);

    function toDateStr(date: Date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    }

    const loggedDates = Array.from(new Set(workouts.map((w) => toDateStr(w.createdAt))));

    function toggleExpanded(exerciseName: string) {
        setExpandedExercises((prev) => {
            const next = new Set(prev);
            if (next.has(exerciseName)) next.delete(exerciseName);
            else next.add(exerciseName);
            return next;
        });
    }

    const exercises: Exercise[] = exerciseCatalog
        .filter((c) => c.category)
        .map((c) => ({
            id: `catalog-${c.category}-${c.muscle ?? "none"}-${c.exercise}`,
            name: c.exercise,
            category: c.category,
            muscle: c.muscle ?? undefined,
            loggingType: c.loggingType,
            allowedLoggingTypes: c.allowedLoggingTypes,
        }));

    const dayWorkouts = workouts.filter((w) => {
        const d = w.createdAt;
        const str = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        return str === todayDateStr;
    });

    const groupedByExercise = new Map<string, WorkoutEntry[]>();
    for (const w of dayWorkouts) {
        const group = groupedByExercise.get(w.exercise) ?? [];
        group.push(w);
        groupedByExercise.set(w.exercise, group);
    }

    return (
        <div className="min-h-screen bg-gray-800 text-neutral-200 pb-24">
            <div className="font-bold text-4xl flex justify-center items-center p-3">
                League Fitness
            </div>

            <div className="bg-blue-900/40 border border-blue-700 rounded-md mx-4 p-3 mb-4 text-sm text-center">
                <p className="mb-1">You're logging as a guest — your workouts are saved on this device only.</p>
                <Link to="/" className="text-blue-400 underline font-bold">
                    Sign up to save your history and access it anywhere
                </Link>
            </div>

            <div className="flex flex-col items-center">
                {flow.step === "category" && (
                    <CategoryStep
                        onSelect={(c) => {
                            flow.setCategory(c);
                            flow.setMuscle(null);
                            setSelectedExercise(null);
                            flow.next(c);
                        }}
                        onSelectRoutines={() => {
                            alert("Sign up to create and use routines.");
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
                        existingExerciseNames={exercises.map((e) => e.name)}
                        onSelectExercise={(exercise) => {
                            setSelectedExercise(exercise);
                            flow.next();
                        }}
                        onCreateExercise={() => {
                            alert("Sign up to create custom exercises.");
                        }}
                        onBack={flow.back}
                        onHome={
                            flow.category !== "cardio"
                                ? () => {
                                    setSelectedExercise(null);
                                    flow.setCategory(null);
                                    flow.setMuscle(null);
                                    flow.setStep("category");
                                } : undefined
                        }
                    />
                )}

                {flow.step === "log" && selectedExercise && (
                    <LogStep
                        exercise={selectedExercise}
                        personalBest={pickBestForExercise(workouts, selectedExercise.name)}
                        onSubmit={(workout) => {
                            addGuestWorkout(workout);
                            flow.back();
                        }}
                        onBack={flow.back}
                        onHome={() => {
                            setSelectedExercise(null);
                            flow.setCategory(null);
                            flow.setMuscle(null);
                            flow.setStep("category");
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
                        selectedDate={null}
                        today={todayDateStr}
                    />
                </div>
            )}

            <h2 className="font-bold mt-4 px-4">Today's Logs</h2>
            {groupedByExercise.size === 0 && (
                <p className="px-4 py-4 text-neutral-400">No workouts logged this day.</p>
            )}
            {Array.from(groupedByExercise.entries()).map(([exerciseName, entries]) => {
                const best = pickBest(entries);
                const isExpanded = expandedExercises.has(exerciseName);
                return (
                    <div key={exerciseName} className="px-4 py-2 border-b border-neutral-700">
                        <div className="flex justify-between items-center">
                            <div>{exerciseName} — {formatLine(best)}</div>
                            <button
                                className="text-red-400 px-2"
                                onClick={() => deleteGuestWorkout(best.id)}
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
                                            onClick={() => deleteGuestWorkout(w.id)}
                                            aria-label="Delete this set"
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

            <NavBar isGuest={true} />
        </div>
    );
}