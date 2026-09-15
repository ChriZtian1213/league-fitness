import type { Exercise } from "~/types/exercise";

export const HARDCODED_EXERCISES: Exercise[] = [
    {id: "1", name: "Barbell Bench Press", category: "upper", muscle: "chest", loggingType: "standard", allowedLoggingTypes: ["standard", "starting-weight"]},
    {id: "2", name: "Triceps Pushdown", category: "upper", muscle: "triceps", loggingType: "standard", allowedLoggingTypes: ["standard"]},
    {id: "3", name: "Dumbbell Shoulder Press", category: "upper", muscle: "shoulders", loggingType: "dumbbell", allowedLoggingTypes: ["dumbbell", "standard"]},
    {id: "4", name: "Cable Curl", category: "upper", muscle: "biceps", loggingType: "standard", allowedLoggingTypes: ["standard"]},
    {id: "5", name: "Barbell Hip Thrust", category: "lower", muscle: "glutes", loggingType: "standard", allowedLoggingTypes: ["standard", "starting-weight"] },
    {id: "6", name: "Machine Leg Curl", category: "lower", muscle: "hamstrings", loggingType: "standard", allowedLoggingTypes: ["standard"] },
    {id: "7", name: "Machine Leg Extension", category: "lower", muscle: "quads", loggingType: "standard", allowedLoggingTypes: ["standard"]},
    {id: "8", name: "Sitting Calve Raise", category: "lower", muscle: "calves", loggingType: "standard", allowedLoggingTypes: ["standard"]},
    {id: "9", name: "Run", category: "cardio"},
    {id: "10", name: "Stair Master", category: "cardio"},
    {id: "11", name: "Push-up", category: "upper", muscle: "chest", loggingType: "bodyweight", allowedLoggingTypes: ["bodyweight"]},
    {id: "12", name: "Pull-up", category: "upper", muscle: "back", loggingType: "bodyweight", allowedLoggingTypes: ["bodyweight"]},
    {id: "13", name: "Dip", category: "upper", muscle: "triceps", loggingType: "bodyweight", allowedLoggingTypes: ["bodyweight"]},
];