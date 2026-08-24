import { connectDB } from "./db.server";
import { ObjectId } from "mongodb";
import { getFriendObjectIds } from "./user.server";

export interface WorkoutInput {
    exercise: string;
    weight?: number;
    reps?: number;
    distance?: number;
    time?: string;
}

export interface StoredWorkout extends WorkoutInput {
    id: string;
    createdAt: Date;
}

// Saves one logged workout for a given user.
export async function createWorkoutEntry(
    userId: string,
    data: WorkoutInput
): Promise<StoredWorkout> {
    const db = await connectDB();
    const createdAt = new Date();

    const result = await db.collection("workouts").insertOne({
        userId: new ObjectId(userId),
        exercise: data.exercise,
        weight: data.weight,
        reps: data.reps,
        distance: data.distance,
        time: data.time,
        createdAt,
    });

    return {
        id: result.insertedId.toString(),
        exercise: data.exercise,
        weight: data.weight,
        reps: data.reps,
        distance: data.distance,
        time: data.time,
        createdAt,
    };
}

// Returns a user's logged workouts, most recent first.
export async function getWorkoutsForUser(
    userId: string
): Promise<StoredWorkout[]> {
    const db = await connectDB();

    const docs = await db
        .collection("workouts")
        .find({ userId: new ObjectId(userId) })
        .sort({ createdAt: -1 })
        .toArray();

    return docs.map((doc: any) => ({
        id: doc._id.toString(),
        exercise: doc.exercise,
        weight: doc.weight,
        reps: doc.reps,
        distance: doc.distance,
        time: doc.time,
        createdAt: doc.createdAt,
    }));
}

export async function deleteWorkoutEntry(
    userId: string,
    id: string
): Promise<void> {
    if (!ObjectId.isValid(id)) {
        throw new Error("Invalid workout id");
    }

    const db = await connectDB();

    const result = await db.collection("workouts").deleteOne({
        _id: new ObjectId(id),
        userId: new ObjectId(userId),
    });

    if (result.deletedCount === 0) {
        throw new Error("Workout not found");
    }
}

export type LeaderboardPeriod = "week" | "month" | "year" | "all";
export type LeaderboardScope = "global" | "friends";
export type LeaderboardMetric = "volume" | "heaviest";

export interface LeaderboardEntry {
    userId: string;
    displayName: string;
    value: number; // total volume, or heaviest single weight lifted
}

// Ranks users either by total weight moved (weight x reps, summed) or by
// the single heaviest weight lifted in any one set, optionally restricted
// to a time window and to friends only. Cardio entries are naturally
// excluded since they have no weight/reps.
export async function getLeaderboard(
    period: LeaderboardPeriod,
    scope: LeaderboardScope,
    metric: LeaderboardMetric,
    userId: string,
    exercise: string | null
): Promise<LeaderboardEntry[]> {
    const db = await connectDB();

    const match: Record<string, any> = {
        weight: { $exists: true, $ne: null },
        reps: { $exists: true, $ne: null },
    };

    if (period !== "all") {
        const since = new Date();
        if (period === "week") since.setDate(since.getDate() - 7);
        if (period === "month") since.setMonth(since.getMonth() - 1);
        match.createdAt = { $gte: since };
    }

    if (scope === "friends") {
        const friendIds = await getFriendObjectIds(userId);
        match.userId = { $in: [...friendIds, new ObjectId(userId)] };
    }

    if (exercise) {
        match.exercise = exercise;
    }

    const group =
        metric === "heaviest"
            ? {
                _id: "$userId",
                value: { $max: "$weight" },
            }
            : {
                _id: "$userId",
                value: { $sum: { $multiply: ["$weight", "$reps"] } },
            };

    const results = await db
        .collection("workouts")
        .aggregate([
            // 1. Only look at strength entries within the time window (and scope)
            { $match: match },
            // 2. Group all matching entries by user, computing volume or max weight
            { $group: group },
            // 3. Highest value first
            { $sort: { value: -1 } },
            { $limit: 50 },
            // 4. Join against the users collection to get displayName
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "user",
                },
            },
            { $unwind: "$user" },
            // 5. Shape the final output
            {
                $project: {
                    _id: 0,
                    userId: { $toString: "$_id" },
                    displayName: "$user.displayName",
                    value: 1,
                },
            },
        ])
        .toArray();

    return results as LeaderboardEntry[];
}

// Returns the distinct list of strength-exercise names that have ever been
// logged, alphabetically sorted, for populating the exercise filter dropdown.
export async function getLoggedExerciseNames(): Promise<string[]> {
    const db = await connectDB();

    const cursorResults = await db
        .collection("workouts")
        .aggregate([
            {
                $match: {
                    weight: { $exists: true, $ne: null },
                    reps: { $exists: true, $ne: null },
                },
            },
            { $group: { _id: "$exercise" } },
            { $sort: { _id: 1 } },
        ])
        .toArray();

    const results = cursorResults as { _id: string }[];

    return results.map((doc) => doc._id);
}