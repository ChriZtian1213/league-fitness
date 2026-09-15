import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();

const db = client.db("LeagueFitness");

const result = await db.collection("workouts").updateMany(
    { exercise: "Cable Rear Delts" },
    { $set: { exercise: "Cable Rope Face Pulls" } }
);

console.log("Updated", result.modifiedCount, "workout document(s)");

await client.close();