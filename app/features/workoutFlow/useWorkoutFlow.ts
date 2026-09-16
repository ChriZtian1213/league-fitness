import { useState } from "react";
import type {Step, Category, Muscle} from "../../types/workout.ts";
import type { RoutineEntry } from "~/server/routine.server";

export function useWorkoutFlow(){
    const [step, setStep] = useState<Step>("category")
    const [category, setCategory] = useState<Category | null>(null)
    const [muscle, setMuscle] = useState<Muscle | null>(null)
    const [activeRoutine, setActiveRoutine] = useState<RoutineEntry | null>(null)
    const [editIntent, setEditIntent] = useState(false)
    const [editReturnStep, setEditReturnStep] = useState<"routines" | "routineHub">("routines");

    function startEditingFromRoutinesList(routine: RoutineEntry) {
        setEditIntent(true);
        setEditReturnStep("routines");
        setActiveRoutine(routine);
        setStep("routines");
    }

    function startEditingActiveRoutine() {
        setEditIntent(true);
        setEditReturnStep("routineHub");
        setStep("routines");
    }

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

   function returnToRoutines(){
        setStep("routines");
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
            setStep(activeRoutine ? "routineHub" : "exercise")
        }
        else if (step === "routines") {
            setStep("category")
        }
    }

    function startRoutine(routine: RoutineEntry) {
        setActiveRoutine(routine);
        setStep("routineHub");
    }

    function exitRoutine() {
        setActiveRoutine(null);
        setEditIntent(false);
        setStep("category");
    }

    function returnToRoutineHub() {
        setStep("routineHub");
    }


    return {
        step, category, muscle, setCategory,
        setMuscle, next, back, setStep,
        activeRoutine, setActiveRoutine, startRoutine, exitRoutine, returnToRoutineHub,
        editIntent, setEditIntent, startEditingActiveRoutine, returnToRoutines, editReturnStep, startEditingFromRoutinesList
    }
}