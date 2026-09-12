import { connectDB } from "./db.server";
import { ObjectId } from "mongodb";
import { getFollowedObjectIds, getMutualFollowObjectIds } from "./user.server";
import type { Category, Muscle} from "~/types/workout";

export interface WorkoutInput {
    exercise: string;
    category: Category;
    muscle?: Muscle;
    weight?: number;
    reps?: number;
    distance?: number;
    time?: string;
}

export interface StoredWorkout extends WorkoutInput {
    id: string;
    createdAt: Date;
}

export interface ExerciseCatalogEntry {
    category: Category;
    muscle: Muscle;
    exercise: string;
}

export async function getExerciseCatalog(): Promise<ExerciseCatalogEntry[]> {
    const db = await connectDB();

    const results = await db
        .collection("workouts")
        .aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user",
                },
            },
            { $unwind: "$user" },
            { $match: { "user.emailVerified": true } },
            {
                $group: {
                    _id: { category: "$category", muscle: "$muscle", exercise: "$exercise" },
                },
            },
            { $sort: { "_id.exercise": 1 } },
        ])
        .toArray();

    return results.map((doc: any)=> ({
        category: doc._id.category ?? null,
        muscle: doc._id.muscle ?? null,
        exercise: doc._id.exercise,
    }));
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
        category: data.category,
        muscle: data.muscle,
        weight: data.weight,
        reps: data.reps,
        distance: data.distance,
        time: data.time,
        createdAt,
    });

    return {
        id: result.insertedId.toString(),
        exercise: data.exercise,
        category: data.category,
        muscle: data.muscle,
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
export type LeaderboardScope = "global" | "following" | "mutual";
export type LeaderboardMetric = "volume" | "heaviest";

export interface LeaderboardEntry {
    userId: string;
    displayName: string;
    value: number; // total volume, or heaviest single weight lifted
    exercise?: string;
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
    category: string | null,
    muscle: string | null,
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

    if (scope === "following") {
        const followedIds = await getFollowedObjectIds(userId);
        match.userId = { $in: [...followedIds, new ObjectId(userId)] };
    }

    if (scope === "mutual") {
        const mutualIds = await getMutualFollowObjectIds(userId);
        match.userId = { $in: [...mutualIds, new ObjectId(userId)] };
    }

    if (category) match.category = category;
    if (muscle) match.muscle = muscle;
    if (exercise) match.exercise = exercise;

    let pipeline: any[];

    if (metric === "heaviest") {
        pipeline = [
            { $match: match },
            { $sort: { weight: -1, reps: -1 } },
            {
                $group: {
                    _id: "$userId",
                    value: { $first: "$weight" },
                    exercise: { $first: "$exercise" },
                },
            },
            { $sort: { value: -1 } },
        ];
    } else {
        pipeline = [
            { $match: match },
            {
                $group: {
                    _id: "$userId",
                    value: { $sum: { $multiply: ["$weight", "$reps"] } },
                },
            },
            { $sort: { value: -1 } },
        ];
    }

    pipeline.push(
        {
            $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "user",
            },
        },
        { $unwind: "$user" },
        { $match: { "user.emailVerified": true } },
        { $limit: 50 },
        {
            $project: {
                _id: 0,
                userId: { $toString: "$_id" },
                displayName: "$user.displayName",
                value: 1,
                exercise: 1,
            },
        }
    );

    const results = await db.collection("workouts").aggregate(pipeline).toArray();
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

// Returns every distinct exercise name ever logged, across all categories
// (strength AND cardio), for autocomplete suggestions when someone creates
// a new custom exercise — helps people converge on consistent naming
// instead of creating near-duplicates like "Cable Fly" vs "Cable Flys".
export async function getAllExerciseNames(): Promise<string[]> {
    const db = await connectDB();

    const cursorResults = await db
        .collection("workouts")
        .aggregate([
            { $group: { _id: "$exercise" } },
            { $sort: { _id: 1 } },
        ])
        .toArray();

    const results = cursorResults as { _id: string }[];

    return results.map((doc) => doc._id);
}

// Returns the set of dates (YYYY-MM-DD, in local server time) this user
// logged at least one workout on — used to highlight days on the calendar.
export async function getWorkoutDatesForUser(userId: string): Promise<string[]> {
    const db = await connectDB();

    const cursorResults = await db
        .collection("workouts")
        .aggregate([
            { $match: { userId: new ObjectId(userId) } },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                    },
                },
            },
        ])
        .toArray();

    return (cursorResults as { _id: string }[]).map((doc) => doc._id);
}