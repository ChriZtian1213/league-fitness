import { useState } from "react";
import type {Step, Category, Muscle} from "../../types/workout.ts";

export function useWorkoutFlow(){
    const [step, setStep] = useState<Step>("category")

    const [category, setCategory] = useState<Category | null>(null)

    const [muscle, setMuscle] = useState<Muscle | null>(null)

    function next(categoryOverride?: Category){
        const currentCategory = categoryOverride ?? category

        if (step === "category") {
            if (currentCategory === "cardio") {
                setStep("exercise");
            } else {
                setStep("muscle");
            }
        }

        else if (step === "muscle") {
            setStep("exercise");
        }

        else if (step === "exercise") {
            setStep("log");
        }
    }

    function back() {
        if (step === "exercise") {
            if (category === "cardio") {
                setStep("category")
            } else {
                setStep("muscle")
            }
        }

        else if (step === "muscle") {
            setStep("category")
        }

        else if (step === "log") {
            setStep("exercise")
        }
    }

    return {
        step, category, muscle, setCategory,
        setMuscle, next, back
    }
}