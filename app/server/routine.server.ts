import { connectDB } from "./db.server";
import { ObjectId } from "mongodb";

export interface RoutineEntry {
    id: string;
    name: string;
    exerciseNames: string[];
    order: number;
}

export async function getRoutinesForUser(userId: string): Promise<RoutineEntry[]> {
    const db = await connectDB();
    const docs = await db
        .collection("routines")
        .find({ userId: new ObjectId(userId) })
        .sort({ order: 1 })
        .toArray();

    return docs.map((d: any) => ({
        id: d._id.toString(),
        name: d.name,
        exerciseNames: d.exerciseNames,
        order: d.order ?? 0,
    }));
}

export async function createRoutine(userId: string, name: string, exerciseNames: string[]): Promise<string> {
    const db = await connectDB();

    const count = await db.collection("routines").countDocuments({ userId: new ObjectId(userId) });

    const result = await db.collection("routines").insertOne({
        userId: new ObjectId(userId),
        name,
        exerciseNames,
        order: count,
        createdAt: new Date(),
    });
    return result.insertedId.toString();
}

export async function deleteRoutine(userId: string, routineId: string): Promise<void> {
    const db = await connectDB();
    await db.collection("routines").deleteOne({
        _id: new ObjectId(routineId),
        userId: new ObjectId(userId),
    });
}

export async function updateRoutine(userId: string, routineId: string, name: string, exerciseNames: string[]): Promise<void> {
    const db = await connectDB();
    await db.collection("routines").updateOne(
        { _id: new ObjectId(routineId), userId: new ObjectId(userId) },
        { $set: { name, exerciseNames } }
    );
}

export async function reorderRoutines(
    userId: string,
    orderedRoutineIds: string[]
): Promise<void> {
    const db = await connectDB();

    const userObjectId = new ObjectId(userId);

    for (let index = 0; index < orderedRoutineIds.length; index++) {
        const routineId = orderedRoutineIds[index];

        await db.collection("routines").updateOne(
            {
                _id: new ObjectId(routineId),
                userId: userObjectId,
            },
            {
                $set: {
                    order: index,
                },
            }
        );
    }
}