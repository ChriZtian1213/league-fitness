export type WorkoutEntry = {
    id: string
    exercise: string
    createdAt: Date

    weight?: number
    reps?: number

    distance?: number
    time?: string
}