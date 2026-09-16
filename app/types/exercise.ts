import type { Category, Muscle} from "./workout.ts";

export type Exercise = {
    id: string
    name: string
    category: Category
    muscle?: Muscle
    loggingType?: LoggingType
    allowedLoggingTypes?: LoggingType[]
    createdBy?: string
    createdAt?: Date
}

export type LoggingType =
    | "standard"
    | "dumbbell"
    | "starting-weight"
    | "bodyweight"
    | "timed"