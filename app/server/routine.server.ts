import { connectDB } from "./db.server";
import { ObjectId } from "mongodb";

export interface RoutineEntry {
    id: string;
    name: string;
    exerciseNames: string[];
}

export async function getRoutinesForUser(userId: string): Promise<RoutineEntry[]> {
    const db = await connectDB();
    const docs = await db
        .collection("routines")
        .find({ userId: new ObjectId(userId) })
        .sort({ name: 1 })
        .toArray();

    return docs.map((d: any) => ({
        id: d._id.toString(),
        name: d.name,
        exerciseNames: d.exerciseNames,
    }));
}

export async function createRoutine(userId: string, name: string, exerciseNames: string[]): Promise<string> {
    const db = await connectDB();
    const result = await db.collection("routines").insertOne({
        userId: new ObjectId(userId),
        name,
        exerciseNames,
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