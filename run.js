import { MongoClient } from "mongodb";
import { HARDCODED_EXERCISES } from "./app/data/exercises.ts"; // adjust path if needed

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db("LeagueFitness");

const dbNames = await db.collection("workouts").distinct("exercise");
const hardcodedNames = new Set(HARDCODED_EXERCISES.map((e) => e.name));

const unmatched = dbNames.filter((name) => !hardcodedNames.has(name));
console.log("Database exercises NOT matching any hardcoded name:", unmatched);

await client.close();