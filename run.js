import { MongoClient, ObjectId } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db("LeagueFitness");

const results = await db.collection("workouts").aggregate([
    { $match: {
            reps: { $exists: true, $ne: null },
            loggingType: { $ne: "bodyweight" },
            weight: { $exists: true, $ne: null },
        }},
    { $sort: { weight: -1 } },
    { $group: {
            _id: "$exercise",
            value: { $first: "$weight" },
            userId: { $first: "$userId" },
        }},
    { $match: { _id: "Dumbbell Shoulder Press" } },
]).toArray();

console.log(results);

await client.close();