import {getFollowedObjectIds} from "~/server/user.server";
import { createNotification } from "~/server/notification.server";
export type FeedScope = "following" | "global";
import { connectDB } from "./db.server";
import { ObjectId } from "mongodb";
import { uploadImage, deleteImage } from "~/server/blob.server";

interface CommentDoc {
    id: string;
    userId: ObjectId;
    displayName: string;
    text: string;
    createdAt: Date;
    likedBy: ObjectId[];
    parentCommentId: string | null;
    edited?: boolean;
    editedAt?: Date;
}

interface PostDoc {
    _id: ObjectId;
    userId: ObjectId;
    imageData: string;
    caption?: string;
    createdAt: Date;
    likedBy: ObjectId[];
    comments: CommentDoc[];
    repostedBy: ObjectId[];
}

export interface CreatePostInput {
    imageData: string;
    caption?: string;
}

export async function createPost(userId: string, data: CreatePostInput) {
    const db = await connectDB();

    const imageUrl = await uploadImage(data.imageData, `posts/${userId}-${Date.now()}`);

    const result = await db.collection<PostDoc>("posts").insertOne({
        userId: new ObjectId(userId),
        imageData: imageUrl,
        caption: data.caption,
        createdAt: new Date(),
        likedBy: [],
        comments: [],
        repostedBy: [],
    } as any);
    return result.insertedId.toString();
}

export async function getFeed(viewerUserId: string, scope: FeedScope = "following") {
    const db = await connectDB();
    const viewerObjectId = new ObjectId(viewerUserId);

    const match: Record<string, any> = {};

    if (scope === "following") {
        const followedIds = await getFollowedObjectIds(viewerUserId);
        match.userId = { $in: [...followedIds, viewerObjectId] };
    }

    const pipeline: any[] = [];

    if (Object.keys(match).length > 0) {
        pipeline.push({ $match: match });
    }

    pipeline.push(
        { $sort: { createdAt: -1 } },
        { $limit: 50 }
    );

    const posts = await db.collection<PostDoc>("posts").aggregate(pipeline).toArray();

    // Fetch the distinct authors separately instead of $lookup — avoids
    // the confirmed join-performance issue.
    const authorIds = [...new Set(posts.map((p: any) => p.userId.toString()))].map((id) => new ObjectId(id));
    const rawAuthors = authorIds.length
        ? await db.collection("users").find({ _id: { $in: authorIds } })
            .project({ displayName: 1, profilePicture: 1, followerIds: 1 })
            .toArray()
        : [];
    const authors = rawAuthors as { _id: ObjectId; displayName: string; profilePicture?: string; followerIds?: ObjectId[] }[];
    const authorMap = new Map(authors.map((a) => [a._id.toString(), a]));

    return posts.map((post: any) => {
        const author = authorMap.get(post.userId.toString());

        return {
            id: post._id.toString(),
            userId: post.userId.toString(),
            displayName: author?.displayName ?? "Unknown",
            profilePicture: author?.profilePicture ?? null,
            imageData: post.imageData,
            caption: post.caption,
            createdAt: post.createdAt,
            likeCount: (post.likedBy ?? []).length,
            likedByMe: (post.likedBy ?? []).some((id: ObjectId) => id.equals(viewerObjectId)),
            commentCount: (post.comments ?? []).length,
            comments: (post.comments ?? []).map((c: any) => ({
                id: c.id,
                userId: c.userId.toString(),
                displayName: c.displayName,
                text: c.text,
                createdAt: c.createdAt,
                likeCount: (c.likedBy ?? []).length,
                likedByMe: (c.likedBy ?? []).some((id: ObjectId) => id.equals(viewerObjectId)),
                parentCommentId: c.parentCommentId ?? null,
                edited: c.edited ?? false,
                editedAt: c.editedAt ?? null,
            })),
            repostCount: (post.repostedBy ?? []).length,
            isFollowing: (author?.followerIds ?? []).some((id: ObjectId) =>
                id.equals(viewerObjectId)
            ),
            isOwnPost: post.userId.equals(viewerObjectId),
            isRepostedByMe: (post.repostedBy ?? []).some((id: ObjectId) => id.equals(viewerObjectId)),
        };
    });
}

export async function toggleLike(userId: string, postId: string) {
    const db = await connectDB();
    const userObjectId = new ObjectId(userId);
    const postObjectId = new ObjectId(postId);

    const post = await db
        .collection<PostDoc>("posts")
        .findOne({ _id: postObjectId }, { projection: { likedBy: 1, userId: 1 } });
    if (!post) throw new Error("Post not found");

    const alreadyLiked = (post.likedBy ?? []).some((id: ObjectId) => id.equals(userObjectId));

    await db.collection<PostDoc>("posts").updateOne(
        { _id: postObjectId },
        alreadyLiked
            ? { $pull: { likedBy: userObjectId } }
            : { $addToSet: { likedBy: userObjectId } }
    );

    if (!alreadyLiked) {
        const fromUser = await db
            .collection("users")
            .findOne({ _id: userObjectId }, { projection: { displayName: 1 } });
        if (fromUser) {
            await createNotification(post.userId.toString(), userId, fromUser.displayName as string, "like", postId);
        }
    }
}

export async function addComment(
    userId: string,
    displayName: string,
    postId: string,
    text: string,
    parentCommentId: string | null = null
) {
    const db = await connectDB();
    const post = await db
        .collection<PostDoc>("posts")
        .findOne({ _id: new ObjectId(postId) }, { projection: { userId: 1 } });

    await db.collection<PostDoc>("posts").updateOne(
        { _id: new ObjectId(postId) },
        {
            $push: {
                comments: {
                    id: new ObjectId().toString(),
                    userId: new ObjectId(userId),
                    displayName,
                    text,
                    createdAt: new Date(),
                    likedBy: [],
                    parentCommentId,
                },
            },
        }
    );

    if (post){
        await createNotification(post.userId.toString(), userId, displayName, "comment", postId);
    }
}

export async function toggleCommentLike(userId: string, postId: string, commentId: string) {
    const db = await connectDB();
    const userObjectId = new ObjectId(userId);
    const postObjectId = new ObjectId(postId);

    const post = await db.collection<PostDoc>("posts").findOne(
        { _id: postObjectId },
        { projection: { comments: 1 } }
    );
    if (!post) throw new Error("Post not found");

    const comment = (post.comments ?? []).find((c) => c.id === commentId);
    if (!comment) throw new Error("Comment not found");

    const alreadyLiked = (comment.likedBy ?? []).some((id: ObjectId) =>
        id.equals(userObjectId)
    );

    await db.collection<PostDoc>("posts").updateOne(
        { _id: postObjectId, "comments.id": commentId },
        alreadyLiked
            ? { $pull: { "comments.$.likedBy": userObjectId } }
            : { $addToSet: { "comments.$.likedBy": userObjectId } }
    );
}

export async function toggleRepost(userId: string, postId: string) {
    const db = await connectDB();
    const userObjectId = new ObjectId(userId);
    const postObjectId = new ObjectId(postId);

    const post = await db
        .collection<PostDoc>("posts")
        .findOne({ _id: postObjectId }, { projection: { repostedBy: 1, userId: 1 } });
    if (!post) throw new Error("Post not found");

    const alreadyReposted = (post.repostedBy ?? []).some((id: ObjectId) =>
        id.equals(userObjectId)
    );

    await db.collection<PostDoc>("posts").updateOne(
        { _id: postObjectId },
        alreadyReposted
            ? { $pull: { repostedBy: userObjectId } }
            : { $addToSet: { repostedBy: userObjectId } }
    );

    if (!alreadyReposted) {
        const fromUser = await db
            .collection("users")
            .findOne({ _id: userObjectId }, { projection: { displayName: 1 } });
        if (fromUser) {
            await createNotification(post.userId.toString(), userId, fromUser.displayName as string, "repost", postId);
        }
    }
}

export async function deleteComment(
    requestUserId: string,
    postId: string,
    commentId: string
){
    const db = await connectDB();
    const postObjectId = new ObjectId(postId);
    const requestingUserObjectId = new ObjectId(requestUserId);

    const post = await db.collection<PostDoc>("posts").findOne({_id: postObjectId}, {projection: { userId: 1, comments: 1}});
    if (!post) throw new Error("Post not found");

    const comment = (post.comments ?? []).find((c) => c.id === commentId);
    if (!comment) throw new Error("Comment not found");

    const isPostOwner = post.userId.equals(requestingUserObjectId);
    const isCommentOwner = comment.userId.equals(requestingUserObjectId);

    if (!isPostOwner && !isCommentOwner) {
        throw new Error("Not authorized to delete this comment");
    }

    const idsToRemove = new Set([commentId]);
    for (const c of post.comments ?? []) {
        if (c.parentCommentId === commentId) idsToRemove.add(c.id);
    }

    await db.collection<PostDoc>("posts").updateOne(
        { _id: postObjectId },
        { $pull: { comments: { id: { $in: [...idsToRemove] } } } }
    );
}

export async function editPost(userId: string, postId: string, newCaption: string) {
    const db = await connectDB();

    const result = await db.collection<PostDoc>("posts").updateOne(
        { _id: new ObjectId(postId), userId: new ObjectId(userId) },
        { $set: { caption: newCaption } }
    );

    if (result.matchedCount === 0) {
        throw new Error("Post not found or not authorized");
    }
}

export async function editComment(
    userId: string,
    postId: string,
    commentId: string,
    newText: string
) {
    const db = await connectDB();
    const postObjectId = new ObjectId(postId);
    const userObjectId = new ObjectId(userId);

    const post = await db.collection<PostDoc>("posts").findOne({_id: postObjectId}, {projection: {comments: 1}});
    if (!post) throw new Error("Post not found");

    const comment = (post.comments ?? []).find((c) => c.id === commentId);
    if (!comment) throw new Error("Comment not found");

    if (!comment.userId.equals(userObjectId)) throw new Error("Not authorized to edit this comment");

    await db.collection<PostDoc>("posts").updateOne(
        { _id: postObjectId, "comments.id": commentId },
        {
            $set: {
                "comments.$.text": newText,
                "comments.$.edited": true,
                "comments.$.editedAt": new Date(),
            },
        }
    );
}

export async function deletePost(userId: string, postId: string) {
    const db = await connectDB();

    const post = await db.collection<PostDoc>("posts").findOne({ _id: new ObjectId(postId), userId: new ObjectId(userId) });

    const result = await db.collection<PostDoc>("posts").deleteOne({
        _id: new ObjectId(postId),
        userId: new ObjectId(userId),
    });

    if (result.deletedCount === 0) {
        throw new Error("Post not found or not authorized");
    }

    if (post?.imageData) {
        await deleteImage(post.imageData);
    }
}

export interface UserPostSummary {
    id: string;
    imageData: string;
    caption?: string;
    createdAt: Date;
}

export async function getPostsByUser(userId: string): Promise<UserPostSummary[]> {
    const db = await connectDB();
    const posts = await db
        .collection<PostDoc>("posts")
        .find({ userId: new ObjectId(userId) })
        .sort({ createdAt: -1 })
        .toArray();

    return posts.map((p) => ({
        id: p._id.toString(),
        imageData: p.imageData,
        caption: p.caption,
        createdAt: p.createdAt,
    }));
}

export async function getPostCount(userId: string): Promise<number> {
    const db = await connectDB();
    return db.collection<PostDoc>("posts").countDocuments({ userId: new ObjectId(userId) });
}

export async function getRepostedPostsByUser(userId: string): Promise<UserPostSummary[]> {
    const db = await connectDB();
    const posts = await db
        .collection<PostDoc>("posts")
        .find({ repostedBy: new ObjectId(userId) })
        .sort({ createdAt: -1 })
        .toArray();

    return posts.map((p) => ({
        id: p._id.toString(),
        imageData: p.imageData,
        caption: p.caption,
        createdAt: p.createdAt,
    }));
}

export async function getPostById(viewerUserId: string, postId: string) {
    const db = await connectDB();
    const viewerObjectId = new ObjectId(viewerUserId);

    if (!ObjectId.isValid(postId)) return null;

    const posts = await db
        .collection<PostDoc>("posts")
        .aggregate([
            { $match: { _id: new ObjectId(postId) } },
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "author",
                },
            },
            { $unwind: "$author" },
        ])
        .toArray();

    const post = posts[0];
    if (!post) return null;
    return {
        id: post._id.toString(),
        userId: post.userId.toString(),
        displayName: post.author.displayName,
        imageData: post.imageData,
        caption: post.caption,
        createdAt: post.createdAt,
        likeCount: (post.likedBy ?? []).length,
        likedByMe: (post.likedBy ?? []).some((id: ObjectId) => id.equals(viewerObjectId)),
        commentCount: (post.comments ?? []).length,
        comments: (post.comments ?? []).map((c: any) => ({
            id: c.id,
            userId: c.userId.toString(),
            displayName: c.displayName,
            text: c.text,
            createdAt: c.createdAt,
            likeCount: (c.likedBy ?? []).length,
            likedByMe: (c.likedBy ?? []).some((id: ObjectId) => id.equals(viewerObjectId)),
            parentCommentId: c.parentCommentId ?? null,
            edited: c.edited ?? false,
            editedAt: c.editedAt ?? null,
        })),
        repostCount: (post.repostedBy ?? []).length,
        isFollowing: (post.author.followerIds ?? []).some((id: ObjectId) =>
            id.equals(viewerObjectId)
        ),
        isOwnPost: post.userId.equals(viewerObjectId),
    };
}