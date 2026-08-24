import { connectDB } from "./db.server";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";

export interface CreateUserInput {
    displayName: string;
    email: string;
    password: string;
}

export async function createUser(data: CreateUserInput) {
    const db = await connectDB();

    const existingUser = await db.collection("users").findOne({
        email: data.email,
    });

    if (existingUser) {
        throw new Error("Email already exists.");
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const result = await db.collection("users").insertOne({
        displayName: data.displayName,
        email: data.email,
        password: hashedPassword,
        friendIds: [],
        createdAt: new Date(),
    });

    return result.insertedId.toString();
}

export interface LoginInput {
    email: string;
    password: string;
}

export async function verifyLogin(
    data: LoginInput
): Promise<string | null> {
    const db = await connectDB();

    const user = await db.collection("users").findOne({
        email: data.email,
    });

    if (!user) {
        return null;
    }

    const isValid = await bcrypt.compare(data.password, user.password);

    if (!isValid) {
        return null;
    }

    return user._id.toString();
}

export interface PublicUser {
    id: string;
    displayName: string;
    email: string;
}

export async function getUserById(userId: string): Promise<PublicUser | null> {
    const db = await connectDB();
    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });
    if (!user) return null;
    return { id: user._id.toString(), displayName: user.displayName, email: user.email };
}

// Returns the ObjectIds of a user's friends. Existing users created before
// this field existed will just have an empty friendIds list (handled by
// the ?? [] fallback below), same as new signups now get by default.
export async function getFriendObjectIds(userId: string): Promise<ObjectId[]> {
    const db = await connectDB();

    const user = await db
        .collection("users")
        .findOne({ _id: new ObjectId(userId) }, { projection: { friendIds: 1 } });

    return (user?.friendIds ?? []) as ObjectId[];
}

// Adds a mutual friendship between two users. No request/accept flow yet —
// a good next step once the leaderboard filter itself is working.
export async function addFriend(userId: string, friendId: string): Promise<void> {
    const db = await connectDB();
    const userObjectId = new ObjectId(userId);
    const friendObjectId = new ObjectId(friendId);

    await db.collection("users").updateOne(
        { _id: userObjectId },
        { $addToSet: { friendIds: friendObjectId } }
    );

    await db.collection("users").updateOne(
        { _id: friendObjectId },
        { $addToSet: { friendIds: userObjectId } }
    );
}