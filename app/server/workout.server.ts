import { connectDB } from "./db.server";
import { ObjectId } from "mongodb";
import { getFollowedObjectIds, getMutualFollowObjectIds } from "./user.server";
import type { Category, Muscle} from "~/types/workout";

export interface ExerciseOverviewEntry {
    exercise: string;
    category: string | null;
    muscle: string | null;
    value: number;
    displayName: string;
    userId: string;
}

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

export interface CardioOverviewEntry {
    exercise: string;
    value: number;
    displayValue: string;
    displayName: string;
    userId: string;
}

// One card per cardio exercise: Stair Master ranks by steps, everything
// else ranks by distance. Kept in exercise-name order (not sorted by
// value) since miles and steps aren't comparable across different rows.
export async function getCardioExerciseOverview(
    period: LeaderboardPeriod,
    scope: LeaderboardScope,
    userId: string
): Promise<CardioOverviewEntry[]> {
    const db = await connectDB();

    const match: Record<string, any> = { category: "cardio" };

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

    const docs = await db.collection("workouts").find(match).toArray();

    const verifiedUsers = await db
        .collection("users")
        .find({ emailVerified: true })
        .project({ displayName: 1 })
        .toArray();
    const verifiedMap = new Map(
        (verifiedUsers as any[]).map((u) => [u._id.toString(), u.displayName])
    );

    const bestByExercise = new Map<string, {value: number; displayValue: string; userId: ObjectId}>();

    for (const doc of docs as any[]) {
        if (!verifiedMap.has(doc.userId.toString())) continue;

        const isStairMaster = doc.exercise === "Stair Master";
        const value = isStairMaster ? doc.steps : doc.distance;
        if (value == null) continue;

        const displayValue = isStairMaster ? `${value} steps` : `${value} mi`;

        const existing = bestByExercise.get(doc.exercise);
        if (!existing || value > existing.value) {
            bestByExercise.set(doc.exercise, {value, displayValue, userId: doc.userId});
        }
    }

    return [...bestByExercise.entries()]
        .map(([exercise, data]) => ({
            exercise,
            value: data.value,
            displayValue: data.displayValue,
            displayName: verifiedMap.get(data.userId.toString()) ?? "Unknown",
            userId: data.userId.toString(),
        }))
        .sort((a, b) => a.exercise.localeCompare(b.exercise));
}

export type CardioMetric = "distance" | "speed" | "steps";

export interface CardioLeaderboardEntry {
    userId: string;
    displayName: string;
    value: number;
    displayValue: string;
}

function parseTimeToSeconds(time: string): number {
    const [minutes, seconds] = time.split(":").map(Number);
    return (minutes || 0) * 60 + (seconds || 0);
}

// Full ranking within one specific cardio exercise. Stair Master only
// ever ranks by steps; every other exercise ranks by distance or speed.
export async function getCardioLeaderboard(
    period: LeaderboardPeriod,
    scope: LeaderboardScope,
    userId: string,
    exercise: string,
    metric: CardioMetric
): Promise<CardioLeaderboardEntry[]> {
    const db = await connectDB();

    const match: Record<string, any> = { category: "cardio", exercise };

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

    const docs = await db.collection("workouts").find(match).toArray();

    const verifiedUsers = await db
        .collection("users")
        .find({ emailVerified: true })
        .project({ displayName: 1 })
        .toArray();
    const verifiedMap = new Map(
        (verifiedUsers as any[]).map((u) => [u._id.toString(), u.displayName])
    );

    const bestByUser = new Map<string, {value: number; displayValue: string}>();

    for (const doc of docs as any[]) {
        const key = doc.userId.toString();
        if (!verifiedMap.has(key)) continue;

        let value: number | null = null;
        let displayValue = "";

        if (metric === "steps" && doc.steps != null) {
            value = doc.steps;
            displayValue = `${doc.steps} steps`;
        } else if (metric === "distance" && doc.distance != null) {
            value = doc.distance;
            displayValue = `${doc.distance} mi`;
        } else if (metric === "speed" && doc.distance != null && doc.time) {
            const minutes = parseTimeToSeconds(doc.time) / 60;
            if (minutes > 0) {
                const mph = doc.distance / (minutes / 60);
                value = mph;
                displayValue = `${mph.toFixed(1)} mph`;
            }
        }

        if (value == null) continue;

        const existing = bestByUser.get(key);
        if (!existing || value > existing.value) {
            bestByUser.set(key, {value, displayValue});
        }
    }

    return [...bestByUser.entries()]
        .map(([uid, data]) => ({
            userId: uid,
            displayName: verifiedMap.get(uid)!,
            value: data.value,
            displayValue: data.displayValue,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 50);
}

// One card per lifting exercise: whoever currently holds the heaviest
// single lift for that exercise. Sorted heaviest-value-first so the
// biggest numbers stand out at the top of the list.
export async function getLiftingExerciseOverview(
    period: LeaderboardPeriod,
    scope: LeaderboardScope,
    userId: string,
    category: string | null,
    muscle: string | null
): Promise<ExerciseOverviewEntry[]> {
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

    const pipeline = [
        { $match: match },
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
        { $sort: { weight: -1, reps: -1 } },
        {
            $group: {
                _id: "$exercise",
                value: { $first: "$weight" },
                userId: { $first: "$userId" },
                displayName: { $first: "$user.displayName" },
                category: { $first: "$category" },
                muscle: { $first: "$muscle" },
            },
        },
        { $sort: { value: -1 } },
        { $limit: 100 },
    ];

    const results = await db.collection("workouts").aggregate(pipeline).toArray();

    return (results as any[]).map((r) => ({
        exercise: r._id,
        category: r.category ?? null,
        muscle: r.muscle ?? null,
        value: r.value,
        displayName: r.displayName,
        userId: r.userId.toString(),
    }));
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
        category: doc.category,
        muscle: doc.muscle,
        steps: doc.steps,
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

    const pipeline: any[] = [
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
        },
    ];

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

export async function getPublicWorkoutDates(viewerUserId: string, profileUserId: string): Promise<string[] | null> {
    const db = await connectDB();

    const isOwnCalendar = viewerUserId === profileUserId;

    if (!isOwnCalendar) {
        const targetUser = await db
            .collection("users")
            .findOne({ _id: new ObjectId(profileUserId) }, { projection: { calendarPublic: 1 } });

        const isPublic = targetUser?.calendarPublic ?? true;
        if (!isPublic) return null;
    }

    return getWorkoutDatesForUser(profileUserId);
}