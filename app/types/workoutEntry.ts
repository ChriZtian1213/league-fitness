import type { Category, Muscle} from "./workout";

export type WorkoutEntry = {
    id: string
    exercise: string
    category: Category
    muscle?: Muscle
    createdAt: Date

    weight?: number
    reps?: number

    distance?: number
    time?: string
}