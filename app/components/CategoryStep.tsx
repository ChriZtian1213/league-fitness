import type {Category} from "../types/workout.ts";


type Props = {
    onSelect: (category: Category) => void
}

export function CategoryStep({onSelect}: Props) {

    return (
        <div>
            <p>Category Step goes here!</p>
            <button onClick={() => onSelect("upper")}>Upper Body</button>
            <button onClick={() => onSelect("lower")}>Lower Body</button>
            <button onClick={() => onSelect("cardio")}>Cardio</button>
        </div>
    )
}