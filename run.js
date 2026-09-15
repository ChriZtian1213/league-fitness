import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db("LeagueFitness");

const matching = await db.collection("workouts").distinct("exercise", {
    exercise: { $regex: /dumbbell/i }
});
console.log("Exercise names matching 'dumbbell':", matching);

const result = await db.collection("workouts").updateMany(
    { exercise: { $regex: /dumbbell/i } },
    { $set: { isDumbbell: true } }
);
console.log("Updated", result.modifiedCount, "workout document(s)");

await client.close();