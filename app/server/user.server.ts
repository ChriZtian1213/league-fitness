import { connectDB } from "./db.server";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";

export interface UserSearchResult {
    id: string;
    displayName: string;
}

// Case-insensitive partial match on displayName. Escapes regex special
// characters so a search containing them (e.g. "a+b") doesn't throw or
// behave unexpectedly.
export async function searchUsers(query: string, limit = 20): Promise<UserSearchResult[]> {
    const db = await connectDB();

    const trimmed = query.trim();
    if (!trimmed) return [];

    const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const users = await db
        .collection("users")
        .find({ displayName: { $regex: escaped, $options: "i" } })
        .limit(limit)
        .project({ displayName: 1 })
        .toArray();

    return users.map((u: any) => ({
        id: u._id.toString(),
        displayName: u.displayName,
    }));
}

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

export async function followUser(userId: string, targetUserId: string): Promise<void> {
    const db = await connectDB();
    await db.collection("users").updateOne(
        { _id: new ObjectId(targetUserId) },
        { $addToSet: { followerIds: new ObjectId(userId) } }
    );
}

export async function unfollowUser(userId: string, targetUserId: string): Promise<void> {
    const db = await connectDB();
    await db.collection("users").updateOne(
        { _id: new ObjectId(targetUserId) },
        { $pull: { followerIds: new ObjectId(userId) } }
    );
}

export async function getFollowerCount(userId: string): Promise<number> {
    const db = await connectDB();
    const user = await db
        .collection("users")
        .findOne({ _id: new ObjectId(userId) }, { projection: { followerIds: 1 } });
    return (user?.followerIds ?? []).length;
}

export async function getFollowingCount(userId: string): Promise<number> {
    const db = await connectDB();
    return db.collection("users").countDocuments({ followerIds: new ObjectId(userId) });
}

export async function isFollowing(viewerId: string, targetUserId: string): Promise<boolean> {
    const db = await connectDB();
    const target = await db
        .collection("users")
        .findOne({ _id: new ObjectId(targetUserId) }, { projection: { followerIds: 1 } });
    return (target?.followerIds ?? []).some((id: ObjectId) => id.equals(new ObjectId(viewerId)));
}

// People this user follows (their "following" list).
export async function getFollowedObjectIds(userId: string): Promise<ObjectId[]> {
    const db = await connectDB();
    const userObjectId = new ObjectId(userId);

    const followedUsers = await db
        .collection("users")
        .find({ followerIds: userObjectId })
        .project({ _id: 1 })
        .toArray();

    return followedUsers.map((u: any) => u._id);
}

// Mutual follows: people this user follows AND who follow this user back.
export async function getMutualFollowObjectIds(userId: string): Promise<ObjectId[]> {
    const db = await connectDB();
    const userObjectId = new ObjectId(userId);

    const [me, following] = await Promise.all([
        db.collection("users").findOne({ _id: userObjectId }, { projection: { followerIds: 1 } }),
        getFollowedObjectIds(userId),
    ]);

    const myFollowerIds = new Set((me?.followerIds ?? []).map((id: ObjectId) => id.toString()));

    return following.filter((id) => myFollowerIds.has(id.toString()));
}