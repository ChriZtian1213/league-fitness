import { MongoClient, ServerApiVersion } from "mongodb";

const uri = process.env.MONGODB_URI!;

const options = {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
    maxPoolSize: 5,
    minPoolSize: 0,
    maxIdleTimeMS: 10000,
};

declare global {
    var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
    // In dev, use a global variable so the value is preserved across
    // module reloads caused by Vite's HMR, avoiding new connections
    // on every file save.
    if (!global._mongoClientPromise) {
        const client = new MongoClient(uri, options);
        global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
} else {
    // In production (Vercel), attach to the global object too — this
    // persists across warm serverless invocations of the same instance,
    // which is what actually reduces redundant connections in practice.
    if (!global._mongoClientPromise) {
        const client = new MongoClient(uri, options);
        global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
}

export async function connectDB() {
    const client = await clientPromise;
    return client.db("LeagueFitness");
}