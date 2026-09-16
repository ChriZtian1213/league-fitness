export type Category = "upper" | "lower" | "cardio"

export type Step = "category" | "muscle" | "exercise" | "log" | "routines" | "routineHub";

export type Muscle = "chest" | "triceps" | "biceps" | "shoulders" |
    "glutes" | "hamstrings" | "quads" | "back" | "calves" | "abs"

export interface Routine {
    id: string;
    userId: string;
    name: string;
    exerciseNames: string[];
}