import type { WorkoutEntry } from "~/types/workoutEntry";

export function formatLine(w: WorkoutEntry) {
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

export function pickBest(entries: WorkoutEntry[]): WorkoutEntry {
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


export function pickBestForExercise(workouts: WorkoutEntry[], exerciseName: string): WorkoutEntry | null {
    const matching = workouts.filter((w) => w.exercise === exerciseName);
    if (matching.length === 0) return null;
    return pickBest(matching);
}
