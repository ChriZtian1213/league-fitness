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

const CONNECT_TIMEOUT_MS = 10000;

function connectWithTimeout(client: MongoClient, ms: number): Promise<MongoClient> {
    return Promise.race([
        client.connect(),
        new Promise<MongoClient>((_, reject) =>
            setTimeout(() => reject(new Error(`MongoDB connection timed out after ${ms}ms`)), ms)
        ),
    ]);
}

function createClientPromise(): Promise<MongoClient> {
    const client = new MongoClient(uri, options);
    return connectWithTimeout(client, CONNECT_TIMEOUT_MS).catch((err) => {
        // If this attempt fails (including timing out), clear the cache so
        // the next call gets a fresh attempt instead of reusing a broken
        // or permanently-stuck promise.
        global._mongoClientPromise = undefined;
        throw err;
    });
}

function getClientPromise(): Promise<MongoClient> {
    if (!global._mongoClientPromise) {
        global._mongoClientPromise = createClientPromise();
    }
    return global._mongoClientPromise;
}

export async function connectDB() {
    const client = await getClientPromise();
    return client.db("LeagueFitness");
}