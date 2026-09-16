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

export async function reorderRoutine(userId: string, routineId: string, direction: "up" | "down"): Promise<void> {
    const db = await connectDB();
    const routines = await getRoutinesForUser(userId);

    const index = routines.findIndex((r) => r.id === routineId);
    if (index === -1) return;

    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= routines.length) return;

    const current = routines[index];
    const swapWith = routines[swapIndex];

    await db.collection("routines").updateOne(
        { _id: new ObjectId(current.id), userId: new ObjectId(userId) },
        { $set: { order: swapWith.order } }
    );
    await db.collection("routines").updateOne(
        { _id: new ObjectId(swapWith.id), userId: new ObjectId(userId) },
        { $set: { order: current.order } }
    );
}