import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db("LeagueFitness");

const sample = await db.collection("workouts").findOne({});
console.log("Sample workout userId:", sample.userId, "| type:", typeof sample.userId, "| is ObjectId:", sample.userId?._bsontype === "ObjectId");

const stringTypeCount = await db.collection("workouts").countDocuments({ userId: { $type: "string" } });
const objectIdTypeCount = await db.collection("workouts").countDocuments({ userId: { $type: "objectId" } });
console.log("userId stored as string:", stringTypeCount);
console.log("userId stored as objectId:", objectIdTypeCount);

await client.close();