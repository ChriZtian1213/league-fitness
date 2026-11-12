import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI);

const from = ["Hip addictor", "Hip Adductor"];
const to = "Hip Adduction Machine";

try {
    await client.connect();
    const db = client.db("LeagueFitness");

    // 1. Logged workouts: rename + fix category/muscle
    const w = await db.collection("workouts").updateMany(
        { exercise: { $in: from } },
        { $set: { exercise: to, category: "lower", muscle: "hips" } }
    );
    console.log("workouts updated:", w.modifiedCount);

    // 2. Routines: swap the name inside exerciseNames
    const r = await db.collection("routines").updateMany(
        { exerciseNames: { $in: from } },
        [{
            $set: {
                exerciseNames: {
                    $map: {
                        input: "$exerciseNames",
                        as: "n",
                        in: { $cond: [{ $in: ["$$n", from] }, to, "$$n"] }
                    }
                }
            }
        }]
    );
    console.log("routines updated:", r.modifiedCount);

    // 3. Remove the stray custom exercises
    const e = await db.collection("exercises").deleteMany({ name: { $in: from } });
    console.log("exercise docs deleted:", e.deletedCount);
} finally {
    await client.close();
}