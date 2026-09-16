import { connectDB } from "~/server/db.server";
import type { Exercise } from "~/types/exercise";

export async function getExercises(): Promise<Exercise[]> {
    const db = await connectDB();

    const exercises = await db
        .collection("exercises")
        .find({})
        .sort({ name: 1 })
        .toArray();

    return exercises.map((exercise) => ({
        id: exercise._id.toString(),
        name: exercise.name,
        category: exercise.category,
        muscle: exercise.muscle,
        loggingType: exercise.loggingType,
        allowedLoggingTypes: exercise.allowedLoggingTypes,
        createdBy: exercise.createdBy?.toString(),
        createdAt: exercise.createdAt,
    }));
}

import { HARDCODED_EXERCISES } from "~/data/exercises";

export async function createExercise(
    exercise: Omit<Exercise, "id">
): Promise<Exercise> {
    const db = await connectDB();

    const normalizedName = exercise.name.trim();

    const matchesHardcoded = HARDCODED_EXERCISES.some(
        (h) => h.name.toLowerCase() === normalizedName.toLowerCase()
    );
    if (matchesHardcoded) {
        throw new Error(`"${normalizedName}" already exists as a built-in exercise.`);
    }

    const existing = await db.collection("exercises").findOne({
        name: { $regex: `^${normalizedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
    });

    if (existing) {
        throw new Error(`"${normalizedName}" already exists as a custom exercise.`);
    }

    const result = await db.collection("exercises").insertOne({
        name: normalizedName,
        category: exercise.category,
        muscle: exercise.muscle,
        loggingType: exercise.loggingType,
        allowedLoggingTypes: exercise.allowedLoggingTypes,
        createdBy: exercise.createdBy,
        createdAt: exercise.createdAt ?? new Date(),
    });

    return {
        ...exercise,
        name: normalizedName,
        id: result.insertedId.toString(),
        createdAt: exercise.createdAt ?? new Date(),
    };
}