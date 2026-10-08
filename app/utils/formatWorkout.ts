import type { WorkoutEntry } from "~/types/workoutEntry";

export type LastSessionRange = {
    date: Date;
    first: WorkoutEntry;
    heaviest: WorkoutEntry;
    setCount: number;
};

function localDateStr(value: Date) {
    const d = new Date(value);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Finds the most recent day (before `excludeDateStr`) this exercise was logged,
// and returns that day's first set plus its best set.
export function getLastSessionRange(
    workouts: WorkoutEntry[],
    exerciseName: string,
    excludeDateStr?: string
): LastSessionRange | null {
    const strengthEntries = workouts.filter(
        (w) => w.exercise === exerciseName && w.reps != null
    );

    const byDay = new Map<string, WorkoutEntry[]>();
    for (const w of strengthEntries) {
        const day = localDateStr(w.createdAt);
        if (day === excludeDateStr) continue;
        const group = byDay.get(day) ?? [];
        group.push(w);
        byDay.set(day, group);
    }

    if (byDay.size === 0) return null;

    const latestDay = [...byDay.keys()].sort().pop()!;
    const entries = byDay
        .get(latestDay)!
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return {
        date: new Date(entries[0].createdAt),
        first: entries[0],
        heaviest: pickBest(entries),
        setCount: entries.length,
    };
}

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
