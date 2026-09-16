import { connectDB } from "./db.server";
import { ObjectId } from "mongodb";
import { getFollowedObjectIds, getMutualFollowObjectIds } from "./user.server";
import type { Category, Muscle} from "~/types/workout";
import type { LoggingType } from "~/types/exercise";
import { HARDCODED_EXERCISES } from "~/data/exercises";

export interface ExerciseOverviewEntry {
    exercise: string;
    category: string | null;
    muscle: string | null;
    value: number;
    displayName: string;
    userId: string;
    loggingType?: LoggingType;
}

export interface WorkoutInput {
    exercise: string;
    category: Category;
    muscle?: Muscle;
    weight?: number;
    reps?: number;
    distance?: number;
    time?: string;
    steps?: number;
    loggingType?: LoggingType;
}

export interface StoredWorkout extends WorkoutInput {
    id: string;
    createdAt: Date;
}

export interface ExerciseCatalogEntry {
    category: Category;
    muscle?: Muscle;
    exercise: string;
    loggingType?: LoggingType;
    allowedLoggingTypes?: LoggingType[];
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
    const CARDIO_PRIORITY = ["Run", "Stair Master", "Walk"];

    function cardioSortKey(exerciseName: string): number {
        const index = CARDIO_PRIORITY.indexOf(exerciseName);
        return index === -1 ? CARDIO_PRIORITY.length : index;
    }

    const db = await connectDB();

    const match: Record<string, any> = {category: "cardio"};

    if (period !== "all") {
        const since = new Date();
        if (period === "week") since.setDate(since.getDate() - 7);
        if (period === "month") since.setMonth(since.getMonth() - 1);
        match.createdAt = {$gte: since};
    }
    if (scope === "following") {
        const followedIds = await getFollowedObjectIds(userId);
        match.userId = {$in: [...followedIds, new ObjectId(userId)]};
    }
    if (scope === "mutual") {
        const mutualIds = await getMutualFollowObjectIds(userId);
        match.userId = {$in: [...mutualIds, new ObjectId(userId)]};
    }

    const docs = await db.collection("workouts").find(match).toArray();

    const verifiedUsers = await db
        .collection("users")
        .find({emailVerified: true})
        .project({displayName: 1})
        .toArray();
    const verifiedMap = new Map(
        (verifiedUsers as any[]).map((u) => [u._id.toString(), u.displayName])
    );

    const bestByExercise = new Map<string, { value: number; displayValue: string; userId: ObjectId }>();

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
        .sort((a, b) => {
            const priorityDiff = cardioSortKey(a.exercise) - cardioSortKey(b.exercise);
            if (priorityDiff !== 0) return priorityDiff;
            return a.exercise.localeCompare(b.exercise);
        });
}

export type CardioMetric = "distance" | "speed" | "steps";

export interface CardioLeaderboardEntry {
    userId: string;
    displayName: string;
    value: number;
    displayValue: string;
}

function parseTimeToSeconds(time: string): number {
    const parts = time.split(":").map(Number);
    if (parts.length === 3) {
        const [hours, minutes, seconds] = parts;
        return hours * 3600 + minutes * 60 + seconds;
    }
    const [minutes, seconds] = parts;
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
        } else if (metric === "speed") {
            if (doc.exercise === "Stair Master" && doc.steps != null && doc.time) {
                const minutes = parseTimeToSeconds(doc.time) / 60;
                if (minutes > 0) {
                    const stepsPerMin = doc.steps / minutes;
                    value = stepsPerMin;
                    displayValue = `${stepsPerMin.toFixed(1)} steps/min`;
                }
            } else if (doc.distance != null && doc.time) {
                const minutes = parseTimeToSeconds(doc.time) / 60;
                if (minutes > 0) {
                    const mph = doc.distance / (minutes / 60);
                    value = mph;
                    displayValue = `${mph.toFixed(1)} mph`;
                }
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

    const baseMatch: Record<string, any> = {
        reps: { $exists: true, $ne: null },
    };

    if (period !== "all") {
        const since = new Date();
        if (period === "week") since.setDate(since.getDate() - 7);
        if (period === "month") since.setMonth(since.getMonth() - 1);
        baseMatch.createdAt = { $gte: since };
    }
    if (scope === "following") {
        const followedIds = await getFollowedObjectIds(userId);
        baseMatch.userId = { $in: [...followedIds, new ObjectId(userId)] };
    }
    if (scope === "mutual") {
        const mutualIds = await getMutualFollowObjectIds(userId);
        baseMatch.userId = { $in: [...mutualIds, new ObjectId(userId)] };
    }
    if (category) baseMatch.category = category;
    if (muscle) baseMatch.muscle = muscle;

    async function runGrouping(sortField: "weight" | "reps", extraMatch: Record<string, any>) {
        const match = { ...baseMatch, ...extraMatch };
        return db.collection("workouts").aggregate([
            { $match: match },
            { $sort: { [sortField]: -1 } },
            {
                $group: {
                    _id: "$exercise",
                    value: { $first: `$${sortField}` },
                    userId: { $first: "$userId" },
                    category: { $first: "$category" },
                    muscle: { $first: "$muscle" },
                    loggingType: { $first: "$loggingType" },
                },
            },
            { $sort: { value: -1 } },
            { $limit: 100 },
        ]).toArray();
    }

    const [weighted, bodyweight] = await Promise.all([
        runGrouping("weight", {
            loggingType: { $ne: "bodyweight" },
            weight: { $exists: true, $ne: null },
        }),
        runGrouping("reps", {
            loggingType: "bodyweight",
        }),
    ]);

    const combined = [...weighted, ...bodyweight] as any[];

    // Fetch the (small number of) distinct users involved, separately —
    // avoids the $lookup stage entirely, which was the confirmed bottleneck.
    const userIds = [...new Set(combined.map((r) => r.userId.toString()))].map((id) => new ObjectId(id));
    const rawUsers = userIds.length
        ? await db.collection("users").find({ _id: { $in: userIds } }).project({ displayName: 1, emailVerified: 1 }).toArray()
        : [];
    const users = rawUsers as { _id: ObjectId; displayName: string; emailVerified?: boolean }[];
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    return combined
        .map((r) => {
            const user = userMap.get(r.userId.toString());
            return {
                exercise: r._id,
                category: r.category ?? null,
                muscle: r.muscle ?? null,
                value: r.value,
                displayName: user?.displayName ?? "Unknown",
                userId: r.userId.toString(),
                loggingType: r.loggingType,
                emailVerified: user?.emailVerified ?? false,
            };
        })
        .filter((r) => r.emailVerified)
        .sort((a, b) => b.value - a.value)
        .slice(0, 100)
        .map(({emailVerified, ...rest}) => rest);
}

let catalogCache: { data: ExerciseCatalogEntry[]; expiresAt: number } | null = null;

export async function getExerciseCatalog(): Promise<ExerciseCatalogEntry[]> {
    if (catalogCache && catalogCache.expiresAt > Date.now()) {
        return catalogCache.data;
    }

    const db = await connectDB();

    const results = await db
        .collection("workouts")
        .aggregate([
            {
                $group: {
                    _id: {
                        category: "$category",
                        muscle: "$muscle",
                        exercise: "$exercise",
                        userId: "$userId",
                    },
                    loggingType: { $first: "$loggingType" },
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id.userId",
                    foreignField: "_id",
                    as: "user",
                },
            },
            { $unwind: "$user" },
            { $match: { "user.emailVerified": true } },
            {
                $group: {
                    _id: {
                        category: "$_id.category",
                        muscle: "$_id.muscle",
                        exercise: "$_id.exercise",
                    },
                    loggingType: { $first: "$loggingType" },
                },
            },
            {
                $sort: {
                    "_id.exercise": 1,
                },
            },
        ])
        .toArray();

    const data = results.map((doc: any) => {
        const hardcodedExercise = HARDCODED_EXERCISES.find(
            (exercise) => exercise.name === doc._id.exercise
        );

        if (hardcodedExercise) {
            return {
                category: hardcodedExercise.category,
                muscle: hardcodedExercise.muscle,
                exercise: hardcodedExercise.name,
                loggingType: hardcodedExercise.loggingType,
                allowedLoggingTypes: hardcodedExercise.allowedLoggingTypes,
            };
        }

        const loggingType = doc.loggingType as LoggingType | undefined;

        return {
            category: doc._id.category,
            muscle: doc._id.muscle,
            exercise: doc._id.exercise,
            loggingType,
            allowedLoggingTypes: loggingType === "bodyweight"
                ? ["bodyweight"] as LoggingType[]
                : loggingType === "dumbbell"
                    ? ["dumbbell", "standard"] as LoggingType[]
                    : loggingType === "starting-weight"
                        ? ["standard", "starting-weight"] as LoggingType[]
                        : ["standard"] as LoggingType[],
        };
    });

    const customExercises = data.filter(
        (dbExercise) =>
            !HARDCODED_EXERCISES.some(
                (hardcodedExercise) => hardcodedExercise.name === dbExercise.exercise
            )
    );

    const hardcodedCatalog = HARDCODED_EXERCISES.map((exercise) => ({
        category: exercise.category,
        muscle: exercise.muscle,
        exercise: exercise.name,
        loggingType: exercise.loggingType,
        allowedLoggingTypes: exercise.allowedLoggingTypes,
    }));

    const mergedCatalog = [
        ...hardcodedCatalog,
        ...customExercises,
    ];

    catalogCache = {
        data: mergedCatalog,
        expiresAt: Date.now() + 60000,
    };

    return mergedCatalog;
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
        steps: data.steps,
        createdAt,
        loggingType: data.loggingType
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
        steps: data.steps,
        loggingType: data.loggingType,
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
        loggingType: doc.loggingType,
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

export interface LeaderboardEntry {
    userId: string;
    displayName: string;
    value: number; // total volume, or heaviest single weight lifted
    exercise?: string;
    loggingType?: LoggingType;
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

    let isBodyweightExercise = false;

    if (exercise) {
        const sample = await db
            .collection("workouts")
            .findOne({ exercise, loggingType: "bodyweight" });

        isBodyweightExercise = !!sample;
    }

    const sortField = isBodyweightExercise ? "reps" : "weight";
    if (!isBodyweightExercise) {
        match.weight = { $exists: true, $ne: null };
    }

    const grouped = await db.collection("workouts").aggregate([
        { $match: match },
        { $sort: { [sortField]: -1 } },
        {
            $group: {
                _id: "$userId",
                value: { $first: `$${sortField}` },
                exercise: { $first: "$exercise" },
                loggingType: { $first: "$loggingType" },
            }
        },
        { $sort: { value: -1 } },
        { $limit: 50 },
    ]).toArray();

    // Fetch the small set of users involved separately, avoiding the
    // $lookup stage entirely — confirmed to be the actual bottleneck.
    const userIds = grouped.map((g: any) => g._id);
    const rawUsers = userIds.length
        ? await db.collection("users").find({ _id: { $in: userIds } }).project({ displayName: 1, emailVerified: 1 }).toArray()
        : [];
    const users = rawUsers as { _id: ObjectId; displayName: string; emailVerified?: boolean }[];
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    return grouped
        .map((g: any) => {
            const user = userMap.get(g._id.toString());
            return {
                userId: g._id.toString(),
                displayName: user?.displayName ?? "Unknown",
                value: g.value,
                exercise: g.exercise,
                emailVerified: user?.emailVerified ?? false,
                loggingType: g.loggingType,
            };
        })
        .filter((r) => r.emailVerified)
        .sort((a, b) => b.value - a.value)
        .slice(0, 50)
        .map(({emailVerified, ...rest}) => rest) as LeaderboardEntry[];
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
export async function getWorkoutDatesForUser(
    userId: string,
    timezone: string = "UTC"
): Promise<string[]> {
    const db = await connectDB();

    const cursorResults = await db
        .collection("workouts")
        .aggregate([
            { $match: { userId: new ObjectId(userId) } },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$createdAt",
                            timezone: timezone,
                        },
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