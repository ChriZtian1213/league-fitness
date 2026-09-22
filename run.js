import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db("LeagueFitness");

const account = await db.collection("users").findOne({ username: "leaguefitness" });

if (!account) {
    console.log("League Fitness account not found — check the username filter.");
} else {
    const allOtherUsers = await db.collection("users").find({ _id: { $ne: account._id } }).toArray();
    const allOtherUserIds = allOtherUsers.map((u) => u._id);

    const result = await db.collection("users").updateOne(
        { _id: account._id },
        { $addToSet: { followerIds: { $each: allOtherUserIds } } }
    );

    console.log(`Added ${allOtherUserIds.length} existing user(s) as followers of League Fitness.`);
    console.log("Modified:", result.modifiedCount);
}

await client.close();