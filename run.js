import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db("LeagueFitness");

const routines = await db.collection("routines").find({}).toArray();
console.log(JSON.stringify(routines, null, 2));

await client.close();