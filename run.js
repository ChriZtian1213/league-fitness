import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db("LeagueFitness");

const routines = await db.collection("routines").find({}).sort({ createdAt: 1 }).toArray();

for (let i = 0; i < routines.length; i++) {
    await db.collection("routines").updateOne(
        { _id: routines[i]._id },
        { $set: { order: i } }
    );
}
console.log("Assigned order to", routines.length, "routine(s)");

await client.close();