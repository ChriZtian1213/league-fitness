import type { Category, Muscle } from "./workout";
import type { LoggingType } from "./exercise";

export type WorkoutEntry = {
    id: string
    exercise: string
    category: Category
    muscle?: Muscle
    loggingType?: LoggingType
    createdAt: Date
    steps?: number

    weight?: number
    reps?: number

    distance?: number
    time?: string
}