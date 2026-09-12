import { connectDB } from "./db.server";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import crypto from "crypto";

const RESEND_COOLDOWN_MS = 60 * 1000; // 60s

export interface PublicUser {
    id: string;
    displayName: string;
    username: string;
    email: string;
    emailVerified: boolean;
    bio?: string;
    profilePicture?: string;
}

export interface UserSearchResult {
    id: string;
    displayName: string;
    username: string;
    profilePicture?: string;
}

export async function getUserById(userId: string): Promise<PublicUser | null> {
    const db = await connectDB();
    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });
    if (!user) return null;
    return {
        id: user._id.toString(),
        displayName: user.displayName,
        username: user.username,
        email: user.email,
        emailVerified: user.emailVerified ?? false,
        bio: user.bio,
        profilePicture: user.profilePicture,
    };
}

export interface UpdateProfileInput {
    displayName?: string;
    bio?: string;
    profilePicture?: string;
}

export async function updateProfile(userId: string, data: UpdateProfileInput): Promise<void> {
    const db = await connectDB();

    const update: Record<string, any> = {};

    if (data.displayName !== undefined) {
        const trimmed = data.displayName.trim();
        if (!trimmed) {
            throw new Error("Display name cannot be empty.");
        }
        update.displayName = trimmed;
    }
    if (data.bio !== undefined) update.bio = data.bio;
    if (data.profilePicture !== undefined) update.profilePicture = data.profilePicture;

    if (Object.keys(update).length === 0) return;

    await db.collection("users").updateOne(
        { _id: new ObjectId(userId) },
        { $set: update }
    );
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
        .project({ displayName: 1, username: 1, profilePicture: 1 })
        .toArray();

    return users.map((u: any) => ({
        id: u._id.toString(),
        displayName: u.displayName,
        username: u.username,
        profilePicture: u.profilePicture,
    }));
}

// Turns a display name into a lowercase, alphanumeric-only username
// suggestion. Purely cosmetic pre-fill — the server still validates and
// checks uniqueness independently of whatever the client sends.
export function slugifyUsername(input: string): string {
    return input.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 20);
}

export interface CreateUserInput {
    displayName: string;
    username: string;
    email: string;
    password: string;
}

export async function createUser(data: CreateUserInput) {
    const db = await connectDB();

    const username = slugifyUsername(data.username);

    if (!username) {
        throw new Error("Username must contain at least one letter or number.");
    }

    const [existingEmail, existingUsername] = await Promise.all([
        db.collection("users").findOne({ email: data.email }),
        db.collection("users").findOne({ username }),
    ]);

    if (existingEmail) {
        throw new Error("Email already exists.");
    }
    if (existingUsername) {
        throw new Error("That username is already taken.");
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const result = await db.collection("users").insertOne({
        displayName: data.displayName,
        username,
        email: data.email,
        password: hashedPassword,
        friendIds: [],
        emailVerified: false,
        verificationToken,
        verificationExpires,
        createdAt: new Date(),
    });

    return {
        userId: result.insertedId.toString(),
        verificationToken
    };
}

export interface LoginInput {
    email: string;
    password: string;
}

export async function verifyLogin(data: LoginInput): Promise<string | null> {
    const db = await connectDB();

    const user = await db.collection("users").findOne({ email: data.email });
    if (!user) return null;

    const isValid = await bcrypt.compare(data.password, user.password);
    if (!isValid) return null;

    return user._id.toString();
}

export async function verifyEmailToken(token: string): Promise<boolean> {
    const db = await connectDB();

    const user = await db.collection("users").findOne({
        verificationToken: token,
        verificationExpires: { $gt: new Date() },
    });

    if (!user) return false;

    await db.collection("users").updateOne(
        { _id: user._id },
        {
            $set: { emailVerified: true },
            $unset: { verificationToken: "", verificationExpires: "" },
        }
    );

    return true;
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

export async function resendVerificationEmail(userId: string): Promise<
    { token: string} | {cooldownSecondsRemaining: number } | null
> {
    const db = await connectDB();
    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });

    if (!user || user.emailVerified) return null;

    const lastSent: Date | undefined = user.lastVerificationSentAt;
    if (lastSent){
        const elapsed = Date.now() - lastSent.getTime();
        if (elapsed < RESEND_COOLDOWN_MS) {
            const remaining = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
            return { cooldownSecondsRemaining: remaining}
        }
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.collection("users").updateOne(
        { _id: new ObjectId(userId) },
        { $set: { verificationToken, verificationExpires, lastVerificationSentAt: new Date() } },
    );

    return { token: verificationToken };
}

export async function getResendCooldownSeconds(userId: string): Promise<number> {
    const db = await connectDB();
    const user = await db.collection("users").findOne(
        { _id: new ObjectId(userId) },
        { projection: { lastVerificationSentAt: 1 } }
    );

    const lastSent: Date | undefined = user?.lastVerificationSentAt;
    if (!lastSent) return 0;

    const elapsed = Date.now() - lastSent.getTime();
    const remaining = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
    return remaining > 0 ? remaining : 0;
}

export async function changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
): Promise<void> {
    const db = await connectDB();
    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });

    if (!user){
        throw new Error("User not found.");
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
        throw new Error("Incorrect current password.");
    }

    if (newPassword.length < 8){
        throw new Error("New password must be at least 8 characters.");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await db.collection("users").updateOne(
        { _id: new ObjectId(userId) },
        { $set: { password: hashedPassword } }
    );
}