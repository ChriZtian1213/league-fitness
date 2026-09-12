import { connectDB } from "./db.server";
import { ObjectId } from "mongodb";

export interface MessageEntry {
    id: string;
    fromUserId: string;
    toUserId: string;
    text: string;
    read: boolean;
    createdAt: Date;
}

export interface ConversationSummary {
    otherUserId: string;
    otherDisplayName: string;
    otherProfilePicture?: string;
    lastMessage: string;
    lastMessageAt: Date;
    unreadCount: number;
}

export async function sendMessage(fromUserId: string, toUserId: string, text: string) {
    const db = await connectDB();
    await db.collection("messages").insertOne({
        fromUserId: new ObjectId(fromUserId),
        toUserId: new ObjectId(toUserId),
        text,
        read: false,
        createdAt: new Date(),
    });
}

export async function getUnreadMessageCount(userId: string): Promise<number> {
    const db = await connectDB();
    return db.collection("messages").countDocuments({
        toUserId: new ObjectId(userId),
        read: false,
    });
}

// Groups all messages involving this user into one row per conversation
// partner, showing the most recent message and how many are unread.
export async function getConversations(userId: string): Promise<ConversationSummary[]> {
    const db = await connectDB();
    const userObjectId = new ObjectId(userId);

    const messages = await db
        .collection("messages")
        .find({ $or: [{ fromUserId: userObjectId }, { toUserId: userObjectId }] })
        .sort({ createdAt: -1 })
        .toArray();

    const byOtherUser = new Map<string, { lastMessage: any; unreadCount: number }>();

    for (const msg of messages) {
        const otherId = msg.fromUserId.equals(userObjectId)
            ? msg.toUserId.toString()
            : msg.fromUserId.toString();

        const isUnreadToMe = msg.toUserId.equals(userObjectId) && !msg.read;

        const existing = byOtherUser.get(otherId);
        if (!existing) {
            byOtherUser.set(otherId, { lastMessage: msg, unreadCount: isUnreadToMe ? 1 : 0 });
        } else if (isUnreadToMe) {
            existing.unreadCount += 1;
        }
    }

    const otherUserIds = [...byOtherUser.keys()].map((id) => new ObjectId(id));
    const users = await db
        .collection("users")
        .find({ _id: { $in: otherUserIds } })
        .project({ displayName: 1, profilePicture: 1 })
        .toArray();

    const typedUsers = users as { _id: ObjectId; displayName: string; profilePicture?: string }[];
    const userMap = new Map(typedUsers.map((u) => [u._id.toString(), u]));

    return [...byOtherUser.entries()]
        .map(([otherId, data]) => {
            const otherUser = userMap.get(otherId);
            return {
                otherUserId: otherId,
                otherDisplayName: otherUser?.displayName ?? "Unknown user",
                otherProfilePicture: otherUser?.profilePicture,
                lastMessage: data.lastMessage.text,
                lastMessageAt: data.lastMessage.createdAt,
                unreadCount: data.unreadCount,
            };
        })
        .sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());
}

export async function getConversationMessages(userId: string, otherUserId: string): Promise<MessageEntry[]> {
    const db = await connectDB();
    const userObjectId = new ObjectId(userId);
    const otherObjectId = new ObjectId(otherUserId);

    const docs = await db
        .collection("messages")
        .find({
            $or: [
                { fromUserId: userObjectId, toUserId: otherObjectId },
                { fromUserId: otherObjectId, toUserId: userObjectId },
            ],
        })
        .sort({ createdAt: 1 })
        .toArray();

    return docs.map((d: any) => ({
        id: d._id.toString(),
        fromUserId: d.fromUserId.toString(),
        toUserId: d.toUserId.toString(),
        text: d.text,
        read: d.read,
        createdAt: d.createdAt,
    }));
}

export async function markConversationRead(userId: string, otherUserId: string): Promise<void> {
    const db = await connectDB();
    await db.collection("messages").updateMany(
        {
            fromUserId: new ObjectId(otherUserId),
            toUserId: new ObjectId(userId),
            read: false,
        },
        { $set: { read: true } }
    );
}