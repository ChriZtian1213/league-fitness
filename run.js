import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db("LeagueFitness");
const result = await db.collection("posts").deleteMany({});
console.log("Deleted", result.deletedCount, "post(s)");
await client.close();