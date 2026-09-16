import type { Exercise } from "~/types/exercise";

export const HARDCODED_EXERCISES: Exercise[] = ([
    // Shoulders
    {name: "Dumbbell Shoulder Press", category: "upper", muscle: "shoulders", loggingType: "dumbbell", allowedLoggingTypes: ["dumbbell", "standard"]},
    {name: "Barbell Overhead Press", category: "upper", muscle: "shoulders", loggingType: "standard", allowedLoggingTypes: ["standard", "starting-weight"]},
    {name: "Dumbbell Lateral Raise", category: "upper", muscle: "shoulders", loggingType: "dumbbell", allowedLoggingTypes: ["dumbbell", "standard"]},
    {name: "Cable Lateral Raise", category: "upper", muscle: "shoulders", loggingType: "standard", allowedLoggingTypes: ["standard"]},
    {name: "Cable Rear Delt Fly", category: "upper", muscle: "shoulders", loggingType: "standard", allowedLoggingTypes: ["standard"]},

    // Chest
    {name: "Barbell Bench Press", category: "upper", muscle: "chest", loggingType: "standard", allowedLoggingTypes: ["standard", "starting-weight"]},
    {name: "Dumbbell Bench Press", category: "upper", muscle: "chest", loggingType: "dumbbell", allowedLoggingTypes: ["dumbbell", "standard"]},
    {name: "Barbell Incline Press", category: "upper", muscle: "chest", loggingType: "standard", allowedLoggingTypes: ["standard", "starting-weight"]},
    {name: "Dumbbell Incline Press", category: "upper", muscle: "chest", loggingType: "dumbbell", allowedLoggingTypes: ["dumbbell", "standard"]},
    {name: "Machine Pec Fly", category: "upper", muscle: "chest", loggingType: "standard", allowedLoggingTypes: ["standard"]},
    {name: "Push Up", category: "upper", muscle: "chest", loggingType: "bodyweight", allowedLoggingTypes: ["bodyweight"]},

    // Triceps
    {name: "Triceps Pushdown", category: "upper", muscle: "triceps", loggingType: "standard", allowedLoggingTypes: ["standard"]},
    {name: "Cable Overhead Triceps Extension", category: "upper", muscle: "triceps", loggingType: "standard", allowedLoggingTypes: ["standard"]},
    {name: "Dumbbell Overhead Triceps Extension", category: "upper", muscle: "triceps", loggingType: "dumbbell", allowedLoggingTypes: ["dumbbell", "standard"]},
    {name: "Barbell Skull Crushers", category: "upper", muscle: "triceps", loggingType: "standard", allowedLoggingTypes: ["standard", "starting-weight"]},
    {name: "Dip", category: "upper", muscle: "triceps", loggingType: "bodyweight", allowedLoggingTypes: ["bodyweight"]},

    // Back
    {name: "Lat Pulldown", category: "upper", muscle: "back", loggingType: "standard", allowedLoggingTypes: ["standard"]},
    {name: "Lat Pulldown Near Grip", category: "upper", muscle: "back", loggingType: "standard", allowedLoggingTypes: ["standard"]},
    {name: "Low Row", category: "upper", muscle: "back", loggingType: "standard", allowedLoggingTypes: ["standard"]},
    {name: "Face Pulls", category: "upper", muscle: "back", loggingType: "standard", allowedLoggingTypes: ["standard"]},
    {name: "Barbell Row", category: "upper", muscle: "back", loggingType: "standard", allowedLoggingTypes: ["standard", "starting-weight"]},
    {name: "Dumbbell Bent Over Row", category: "upper", muscle: "back", loggingType: "dumbbell", allowedLoggingTypes: ["dumbbell", "standard"]},
    {name: "Seated Cable Row", category: "upper", muscle: "back", loggingType: "standard", allowedLoggingTypes: ["standard"]},
    {name: "Pull Up", category: "upper", muscle: "back", loggingType: "bodyweight", allowedLoggingTypes: ["bodyweight"]},

    // Biceps
    {name: "Cable Curl", category: "upper", muscle: "biceps", loggingType: "standard", allowedLoggingTypes: ["standard"]},
    {name: "Cable Hammer Curl", category: "upper", muscle: "biceps", loggingType: "standard", allowedLoggingTypes: ["standard"]},
    {name: "Cable Reverse Curl", category: "upper", muscle: "biceps", loggingType: "standard", allowedLoggingTypes: ["standard"]},
    {name: "Dumbbell Curl", category: "upper", muscle: "biceps", loggingType: "dumbbell", allowedLoggingTypes: ["dumbbell", "standard"]},
    {name: "Dumbbell Hammer Curl", category: "upper", muscle: "biceps", loggingType: "dumbbell", allowedLoggingTypes: ["dumbbell", "standard"]},
    {name: "Barbell Curl", category: "upper", muscle: "biceps", loggingType: "standard", allowedLoggingTypes: ["standard", "starting-weight"]},

    // Abs
    {name: "Sit Up", category: "upper", muscle: "abs", loggingType: "bodyweight", allowedLoggingTypes: ["bodyweight"]},
    {name: "Cable Crunch", category: "upper", muscle: "abs", loggingType: "standard", allowedLoggingTypes: ["standard"]},
    {name: "Hanging Leg Raise", category: "upper", muscle: "abs", loggingType: "bodyweight", allowedLoggingTypes: ["bodyweight"]},
    {name: "Plank", category: "upper", muscle: "abs", loggingType: "timed", allowedLoggingTypes: ["timed"]},

    // Quads
    {name: "Hack Squat", category: "lower", muscle: "quads", loggingType: "standard", allowedLoggingTypes: ["standard", "starting-weight"]},
    {name: "Barbell Squat", category: "lower", muscle: "quads", loggingType: "standard", allowedLoggingTypes: ["standard", "starting-weight"]},
    {name: "Leg Press", category: "lower", muscle: "quads", loggingType: "standard", allowedLoggingTypes: ["standard"]},
    {name: "Machine Leg Extension", category: "lower", muscle: "quads", loggingType: "standard", allowedLoggingTypes: ["standard"]},

    // Hamstrings
    {name: "Barbell RDL", category: "lower", muscle: "hamstrings", loggingType: "standard", allowedLoggingTypes: ["standard", "starting-weight"]},
    {name: "Dumbbell RDL", category: "lower", muscle: "hamstrings", loggingType: "dumbbell", allowedLoggingTypes: ["dumbbell", "standard"]},
    {name: "Bodyweight RDL", category: "lower", muscle: "hamstrings", loggingType: "bodyweight", allowedLoggingTypes: ["bodyweight"]},
    {name: "Machine Leg Curl", category: "lower", muscle: "hamstrings", loggingType: "standard", allowedLoggingTypes: ["standard"]},

    // Glutes
    {name: "Barbell Hip Thrust", category: "lower", muscle: "glutes", loggingType: "standard", allowedLoggingTypes: ["standard", "starting-weight"]},
    {name: "Cable Glute Kickback", category: "lower", muscle: "glutes", loggingType: "standard", allowedLoggingTypes: ["standard"]},
    {name: "Bodyweight Glute Bridge", category: "lower", muscle: "glutes", loggingType: "bodyweight", allowedLoggingTypes: ["bodyweight"]},

    // Calves
    {name: "Sitting Calve Raise", category: "lower", muscle: "calves", loggingType: "standard", allowedLoggingTypes: ["standard"]},
    {name: "Standing Calf Raise", category: "lower", muscle: "calves", loggingType: "standard", allowedLoggingTypes: ["standard"]},

    // Cardio
    {name: "Run", category: "cardio"},
    {name: "Stair Master", category: "cardio"},
    {name: "Outdoor Cycle", category: "cardio"},
    {name: "Walk", category: "cardio"},

] as Omit<Exercise, "id">[]).map((exercise, index) => ({
    ...exercise,
    id: `hardcoded-${index}`,
}));