import { connectDB } from "./db.server";
import { ObjectId } from "mongodb";
import {getFollowedObjectIds} from "~/server/user.server";

export type FeedScope = "following" | "global";

export interface CreatePostInput {
    imageData: string;
    caption?: string;
}

export async function createPost(userId: string, data: CreatePostInput) {
    const db = await connectDB();
    const result = await db.collection("posts").insertOne({
        userId: new ObjectId(userId),
        imageData: data.imageData,
        caption: data.caption,
        createdAt: new Date(),
        likedBy: [] as ObjectId[],
        comments: [] as any[],
        repostedBy: [] as ObjectId[],
    });
    return result.insertedId.toString();
}

// Global feed, newest first. Also computes per-viewer state (liked/following)
// so the UI doesn't need a second round trip.
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
        { $limit: 50 },
        {
            $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "author",
            },
        },
        { $unwind: "$author" }
    );

    const posts = await db.collection("posts").aggregate(pipeline).toArray();

    return posts.map((post: any) => ({
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
    }));
}

export async function toggleLike(userId: string, postId: string) {
    const db = await connectDB();
    const userObjectId = new ObjectId(userId);
    const postObjectId = new ObjectId(postId);

    const post = await db
        .collection("posts")
        .findOne({ _id: postObjectId }, { projection: { likedBy: 1 } });
    if (!post) throw new Error("Post not found");

    const alreadyLiked = (post.likedBy ?? []).some((id: ObjectId) => id.equals(userObjectId));

    await db.collection("posts").updateOne(
        { _id: postObjectId },
        alreadyLiked
            ? { $pull: { likedBy: userObjectId } }
            : { $addToSet: { likedBy: userObjectId } }
    );
}

export async function addComment(
    userId: string,
    displayName: string,
    postId: string,
    text: string,
    parentCommentId: string | null = null
) {
    const db = await connectDB();
    await db.collection("posts").updateOne(
        { _id: new ObjectId(postId) },
        {
            $push: {
                comments: {
                    id: new ObjectId().toString(),
                    userId: new ObjectId(userId),
                    displayName,
                    text,
                    createdAt: new Date(),
                    likedBy: [] as ObjectId[],
                    parentCommentId,
                },
            },
        }
    );
}

export async function toggleCommentLike(userId: string, postId: string, commentId: string) {
    const db = await connectDB();
    const userObjectId = new ObjectId(userId);
    const postObjectId = new ObjectId(postId);

    const post = await db.collection("posts").findOne(
        { _id: postObjectId },
        { projection: { comments: 1 } }
    );
    if (!post) throw new Error("Post not found");

    const comment = (post.comments ?? []).find((c: any) => c.id === commentId);
    if (!comment) throw new Error("Comment not found");

    const alreadyLiked = (comment.likedBy ?? []).some((id: ObjectId) =>
        id.equals(userObjectId)
    );

    await db.collection("posts").updateOne(
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
        .collection("posts")
        .findOne({ _id: postObjectId }, { projection: { repostedBy: 1 } });
    if (!post) throw new Error("Post not found");

    const alreadyReposted = (post.repostedBy ?? []).some((id: ObjectId) =>
        id.equals(userObjectId)
    );

    await db.collection("posts").updateOne(
        { _id: postObjectId },
        alreadyReposted
            ? { $pull: { repostedBy: userObjectId } }
            : { $addToSet: { repostedBy: userObjectId } }
    );
}

export async function deleteComment(
    requestUserId: string,
    postId: string,
    commentId: string
){
    const db = await connectDB();
    const postObjectId = new ObjectId(postId);
    const requestingUserObjectId = new ObjectId(requestUserId);

    const post = await db.collection("posts").findOne({_id: postObjectId}, {projection: { userId: 1, comments: 1}});
    if (!post) throw new Error("Post not found");

    const comment = (post.comments ?? []).find((c: any) => c.id === commentId);
    if (!comment) throw new Error("Comment not found");

    const isPostOwner = post.userId.equals(requestingUserObjectId);
    const isCommentOwner = comment.userId.equals(requestingUserObjectId);

    if (!isPostOwner && !isCommentOwner) {
        throw new Error("Not authorized to delete this comment");
    }

    // Cascade: also remove any replies pointing at this comment, so we
    // never leave orphaned replies with a dangling parentCommentId.
    const idsToRemove = new Set([commentId]);
    for (const c of post.comments ?? []) {
        if (c.parentCommentId === commentId) idsToRemove.add(c.id);
    }

    await db.collection("posts").updateOne(
        { _id: postObjectId },
        { $pull: { comments: { id: { $in: [...idsToRemove] } } } }
    );

}

export async function editPost(userId: string, postId: string, newCaption: string) {
    const db = await connectDB();

    const result = await db.collection("posts").updateOne(
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

    const post = await db.collection("posts").findOne({_id: postObjectId}, {projection: {comments: 1}});
    if (!post) throw new Error("Post not found");

    const comment = (post.comments ?? []).find((c: any) => c.id === commentId);
    if (!comment) throw new Error("Comment not found");

    if (!comment.userId.equals(userObjectId)) throw new Error("Not authorized to edit this comment");

    await db.collection("posts").updateOne(
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

export async function deletePost(
    userId: string,
    postId: string
) {
    const db = await connectDB();

    const result = await db.collection("posts").deleteOne({
        _id: new ObjectId(postId),
        userId: new ObjectId(userId),
    });

    if (result.deletedCount === 0) {
        throw new Error("Post not found or not authorized");
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
        .collection("posts")
        .find({ userId: new ObjectId(userId) })
        .sort({ createdAt: -1 })
        .toArray();

    return posts.map((p: any) => ({
        id: p._id.toString(),
        imageData: p.imageData,
        caption: p.caption,
        createdAt: p.createdAt,
    }));
}

export async function getPostCount(userId: string): Promise<number> {
    const db = await connectDB();
    return db.collection("posts").countDocuments({ userId: new ObjectId(userId) });
}

export async function getRepostedPostsByUser(userId: string): Promise<UserPostSummary[]> {
    const db = await connectDB();
    const posts = await db
        .collection("posts")
        .find({ repostedBy: new ObjectId(userId) })
        .sort({ createdAt: -1 })
        .toArray();

    return posts.map((p: any) => ({
        id: p._id.toString(),
        imageData: p.imageData,
        caption: p.caption,
        createdAt: p.createdAt,
    }));
}

// Single post with full detail — comments, like/repost counts — for the
// post detail page. Returns null if the post doesn't exist.
export async function getPostById(viewerUserId: string, postId: string) {
    const db = await connectDB();
    const viewerObjectId = new ObjectId(viewerUserId);

    if (!ObjectId.isValid(postId)) return null;

    const posts = await db
        .collection("posts")
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