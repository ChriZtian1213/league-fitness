import { connectDB } from "./db.server";
import { ObjectId } from "mongodb";

export type NotificationType = "like" | "comment" | "follow";

export interface NotificationEntry {
    id: string;
    type: NotificationType;
    fromUserId: string;
    fromDisplayName: string;
    postId?: string;
    read: boolean;
    createdAt: Date;
}

export async function createNotification(
    toUserId: string,
    fromUserId: string,
    fromDisplayName: string,
    type: NotificationType,
    postId?: string
) {
    if (toUserId === fromUserId) return; // don't notify yourself

    const db = await connectDB();
    await db.collection("notifications").insertOne({
        toUserId: new ObjectId(toUserId),
        fromUserId: new ObjectId(fromUserId),
        fromDisplayName,
        type,
        postId: postId ? new ObjectId(postId) : undefined,
        read: false,
        createdAt: new Date(),
    });
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
    const db = await connectDB();
    return db.collection("notifications").countDocuments({
        toUserId: new ObjectId(userId),
        read: false,
    });
}

export async function getNotificationsForUser(userId: string): Promise<NotificationEntry[]> {
    const db = await connectDB();
    const docs = await db
        .collection("notifications")
        .find({ toUserId: new ObjectId(userId) })
        .sort({ createdAt: -1 })
        .limit(50)
        .toArray();

    return docs.map((d: any) => ({
        id: d._id.toString(),
        type: d.type,
        fromUserId: d.fromUserId.toString(),
        fromDisplayName: d.fromDisplayName,
        postId: d.postId?.toString(),
        read: d.read,
        createdAt: d.createdAt,
    }));
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
    const db = await connectDB();
    await db.collection("notifications").updateMany(
        { toUserId: new ObjectId(userId), read: false },
        { $set: { read: true } }
    );
}