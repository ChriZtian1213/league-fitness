import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db("LeagueFitness");

const r1 = await db.collection("workouts").updateMany(
    { exercise: "Rope Face Pulls" },
    { $set: { exercise: "Face Pulls" } }
);
const r2 = await db.collection("workouts").updateMany(
    { exercise: "Cable Triceps Pushdown" },
    { $set: { exercise: "Triceps Pushdown" } }
);
const r3 = await db.collection("workouts").updateMany(
    { exercise: "Cable Triceps Overhead" },
    { $set: { exercise: "Triceps Overhead" } }
)

console.log("Face Pulls updated:", r1.modifiedCount);
console.log("Triceps Pushdown updated:", r2.modifiedCount);

await client.close();