import "dotenv/config";
import { MongoClient, ServerApiVersion } from "mongodb";

const uri = process.env.MONGODB_URI!;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

let db: any = null;

export async function connectDB() {
    if (!db) {
        await client.connect();

        db = client.db("LeagueFitness");

        console.log("Connected to MongoDB");
    }

    return db;
}