import type {Category} from "../types/workout.ts";


type Props = {
    onSelect: (category: Category) => void
}

export function CategoryStep({onSelect}: Props) {

    return (
        <div>
            <div className="flex justify-center p-2">Select Category Worked</div>

            <div className={"flex items-center gap-2"}>
                <button
                    className={"size-24 border flex flex-col items-center justify-center"}
                    className={"size-24 border flex flex-col items-center justify-center"}
                    onClick={() => onSelect("upper")}
                >
                    <span>Upper Body</span>
                    <span>💪</span>
                </button>

                <button
                    className={"size-24 border flex flex-col items-center justify-center"}
                    onClick={() => onSelect("lower")}
                >
                    <span>Lower Body</span>
                    <span>🦵</span>
                </button>

                <button
                    className={"size-24 border flex flex-col items-center justify-center"}
                    onClick={() => onSelect("cardio")}
                >
                    <span>Cardio</span>
                    <span>🏃</span>
                </button>
            </div>
        </div>
    )
}