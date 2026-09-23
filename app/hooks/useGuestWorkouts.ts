import { useState, useEffect } from "react";
import type { WorkoutEntry } from "~/types/workoutEntry";

const STORAGE_KEY = "league-fitness-guest-workouts";

export function useGuestWorkouts() {
    const [workouts, setWorkouts] = useState<WorkoutEntry[]>([]);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw) as WorkoutEntry[];
                setWorkouts(parsed.map((w) => ({ ...w, createdAt: new Date(w.createdAt) })));
            }
        } catch {
            // Corrupted or unavailable storage — start fresh rather than crash.
        }
    }, []);

    function addGuestWorkout(workout: WorkoutEntry) {
        setWorkouts((prev) => {
            const next = [workout, ...prev];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            return next;
        });
    }

    function deleteGuestWorkout(id: string) {
        setWorkouts((prev) => {
            const next = prev.filter((w) => w.id !== id);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            return next;
        });
    }

    function clearGuestWorkouts() {
        localStorage.removeItem(STORAGE_KEY);
        setWorkouts([]);
    }

    return { workouts, addGuestWorkout, deleteGuestWorkout, clearGuestWorkouts };
}