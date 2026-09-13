import { connectDB } from "./db.server";
import { ObjectId } from "mongodb";

export type NotificationType = "like" | "comment" | "follow" | "repost";

export interface NotificationEntry {
    id: string;
    type: NotificationType;
    fromUserId: string;
    fromDisplayName: string;
    fromProfilePicture?: string;
    postId?: string;
    postImagePreview?: string;
    commentPreview?: string;
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

interface RawNotificationDoc {
    _id: ObjectId;
    toUserId: ObjectId;
    type: NotificationType;
    fromUserId: ObjectId;
    fromDisplayName: string;
    postId?: ObjectId;
    read: boolean;
    createdAt: Date;
}

export async function getNotificationsForUser(userId: string): Promise<NotificationEntry[]> {
    const db = await connectDB();
    const rawDocs = await db
        .collection("notifications")
        .find({ toUserId: new ObjectId(userId) })
        .sort({ createdAt: -1 })
        .limit(50)
        .toArray();

    const docs = rawDocs as RawNotificationDoc[];

    const fromUserIds = [...new Set(docs.map((d) => d.fromUserId.toString()))].map(
        (id) => new ObjectId(id)
    );
    const rawUsers = await db
        .collection("users")
        .find({ _id: { $in: fromUserIds } })
        .project({ profilePicture: 1 })
        .toArray();
    const users = rawUsers as { _id: ObjectId; profilePicture?: string }[];
    const userMap = new Map(users.map((u) => [u._id.toString(), u.profilePicture]));

    const postIds = [...new Set(docs.filter((d) => d.postId).map((d) => d.postId!.toString()))].map(
        (id) => new ObjectId(id)
    );

    const rawPosts = postIds.length
        ? await db
            .collection("posts")
            .find({ _id: { $in: postIds } })
            .project({ imageData: 1, comments: 1 })
            .toArray()
        : [];

    const posts = rawPosts as { _id: ObjectId; imageData?: string; comments?: any[] }[];
    const postMap = new Map(posts.map((p) => [p._id.toString(), p]));

    return docs.map((d) => {
        const post = d.postId ? postMap.get(d.postId.toString()) : undefined;

        let commentPreview: string | undefined;
        if (d.type === "comment" && post) {
            const matchingComment = (post.comments ?? [])
                .slice()
                .reverse()
                .find((c: any) => c.userId.equals(d.fromUserId));
            commentPreview = matchingComment?.text;
        }

        return {
            id: d._id.toString(),
            type: d.type,
            fromUserId: d.fromUserId.toString(),
            fromDisplayName: d.fromDisplayName,
            fromProfilePicture: userMap.get(d.fromUserId.toString()),
            postId: d.postId?.toString(),
            postImagePreview: post?.imageData,
            commentPreview,
            read: d.read,
            createdAt: d.createdAt,
        };
    });
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
    const db = await connectDB();
    await db.collection("notifications").updateMany(
        { toUserId: new ObjectId(userId), read: false },
        { $set: { read: true } }
    );
}