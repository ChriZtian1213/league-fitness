import type { Category, Muscle} from "./workout.ts";

export type Exercise = {
    id: string
    name: string
    category: Category
    muscle?: Muscle
    isBodyweight?: boolean
    createdBy?: string
    createdAt?: number
}