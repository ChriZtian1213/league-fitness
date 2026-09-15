import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();

const db = client.db("LeagueFitness");
const workouts = db.collection("workouts");

// Rename old exercise name
const renameResult = await workouts.updateMany(
    { exercise: "Cable Rope Face Pulls" },
    { $set: { exercise: "Rope Face Pulls" } }
);

console.log(
    "Renamed",
    renameResult.modifiedCount,
    "Cable Rope Face Pulls workout document(s)"
);

// Convert dumbbell workouts
const dumbbellResult = await workouts.updateMany(
    { isDumbbell: true },
    {
        $set: { loggingType: "dumbbell" },
        $unset: {
            isDumbbell: "",
            isBarbell: "",
            isBodyweight: "",
        },
    }
);

console.log(
    "Updated",
    dumbbellResult.modifiedCount,
    "dumbbell workout document(s)"
);

// Convert bodyweight workouts
const bodyweightResult = await workouts.updateMany(
    {
        isBodyweight: true,
        loggingType: { $exists: false },
    },
    {
        $set: { loggingType: "bodyweight" },
        $unset: {
            isDumbbell: "",
            isBarbell: "",
            isBodyweight: "",
        },
    }
);

console.log(
    "Updated",
    bodyweightResult.modifiedCount,
    "bodyweight workout document(s)"
);

// Convert barbell workouts
const barbellResult = await workouts.updateMany(
    {
        isBarbell: true,
        loggingType: { $exists: false },
    },
    {
        $set: { loggingType: "starting-weight" },
        $unset: {
            isDumbbell: "",
            isBarbell: "",
            isBodyweight: "",
        },
    }
);

console.log(
    "Updated",
    barbellResult.modifiedCount,
    "barbell workout document(s)"
);

// Convert remaining strength workouts to standard
const standardResult = await workouts.updateMany(
    {
        category: { $ne: "cardio" },
        loggingType: { $exists: false },
    },
    {
        $set: { loggingType: "standard" },
        $unset: {
            isDumbbell: "",
            isBarbell: "",
            isBodyweight: "",
        },
    }
);

console.log(
    "Updated",
    standardResult.modifiedCount,
    "standard workout document(s)"
);

// Remove old flags from any documents that may still have them.
// This catches documents that already had a loggingType.
const cleanupResult = await workouts.updateMany(
    {},
    {
        $unset: {
            isDumbbell: "",
            isBarbell: "",
            isBodyweight: "",
        },
    }
);

console.log(
    "Cleaned up old logging fields from",
    cleanupResult.modifiedCount,
    "workout document(s)"
);

await client.close();

console.log("Workout migration complete.");