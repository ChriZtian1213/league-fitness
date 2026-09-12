import type {Route} from "./+types/post";
import {useState} from "react";
import {Form, Link, useLoaderData} from "react-router";
import {NavBar} from "~/components/NavBar";
import {requireUserId} from "~/server/session.server";
import {getPostById, toggleLike, toggleRepost, addComment, toggleCommentLike, deleteComment, editComment, editPost, deletePost} from "~/server/post.server";
import {redirect} from "react-router";
import {getUserById} from "~/server/user.server";
import {CommentThread} from "~/components/CommentThread";

export async function loader({request, params}: Route.LoaderArgs) {
    const userId = await requireUserId(request);
    const postId = (params as {postId: string}).postId;

    const post = await getPostById(userId, postId);
    if (!post) {
        throw new Response("Post not found", {status: 404});
    }

    return {post, userId};
}

export async function action({request, params}: Route.ActionArgs) {
    const userId = await requireUserId(request);
    const postId = (params as {postId: string}).postId;
    const formData = await request.formData();
    const intent = formData.get("intent");

    const writeIntents = new Set([
        "like", "repost", "editPost", "comment", "likeComment", "deleteComment", "editComment",
    ]);

    if (writeIntents.has(intent as string)) {
        const user = await getUserById(userId);
        if (!user?.emailVerified) {
            return {error: "Please verify your email to do that."};
        }
    }

    if (intent === "deletePost") {
        try {
            await deletePost(userId, postId);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Could not delete post.";
            return {error: message};
        }
        return redirect("/home");
    }

    if (intent === "like") {
        await toggleLike(userId, postId);
        return {ok: true};
    }

    if (intent === "repost") {
        await toggleRepost(userId, postId);
        return {ok: true};
    }

    if (intent === "editPost") {
        const caption = formData.get("caption");
        if (typeof caption === "string") {
            try {
                await editPost(userId, postId, caption.trim());
            } catch (err) {
                const message = err instanceof Error ? err.message : "Could not edit post.";
                return {error: message};
            }
        }
        return {ok: true};
    }

    if (intent === "comment") {
        const text = formData.get("text");
        const parentCommentId = formData.get("parentCommentId");
        if (typeof text === "string" && text.trim()) {
            const user = await getUserById(userId);
            if (user) {
                await addComment(
                    userId,
                    user.displayName,
                    postId,
                    text.trim(),
                    typeof parentCommentId === "string" ? parentCommentId : null
                );
            }
        }
        return {ok: true};
    }

    if (intent === "likeComment") {
        const commentId = formData.get("commentId");
        if (typeof commentId === "string") {
            await toggleCommentLike(userId, postId, commentId);
        }
        return {ok: true};
    }

    if (intent === "deleteComment") {
        const commentId = formData.get("commentId");
        if (typeof commentId === "string") {
            try {
                await deleteComment(userId, postId, commentId);
            } catch (err) {
                const message = err instanceof Error ? err.message : "Could not delete comment.";
                return {error: message};
            }
        }
        return {ok: true};
    }

    if (intent === "editComment") {
        const commentId = formData.get("commentId");
        const text = formData.get("text");
        if (typeof commentId === "string" && typeof text === "string" && text.trim()) {
            try {
                await editComment(userId, postId, commentId, text.trim());
            } catch (err) {
                const message = err instanceof Error ? err.message : "Could not edit comment.";
                return {error: message};
            }
        }
        return {ok: true};
    }

    return {error: "Unknown action"};
}

function timeAgo(date: Date) {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return "Now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}hr`;
    return `${Math.floor(hours / 24)}d`;
}

export default function PostDetail() {
    const {post, userId} = useLoaderData<typeof loader>();
    const [isEditingCaption, setIsEditingCaption] = useState(false);

    return (
        <div className="min-h-screen bg-gray-800 text-neutral-200 pb-24">
            <div className="flex flex-col items-center gap-3 p-4">
                <div className="flex flex-row gap-4 items-center">
                    <Link to={`/profile/${post.userId}`} className="font-bold hover:underline">
                        {post.displayName}
                    </Link>
                    <p>⚆ {timeAgo(post.createdAt)}</p>
                    {post.isOwnPost && (
                        <Form method="post">
                            <input type="hidden" name="intent" value="deletePost" />
                            <button type="submit" className="text-red-400">
                                Delete
                            </button>
                        </Form>
                    )}
                </div>

                <img
                    className="w-full max-w-md border-2 border-black object-cover"
                    src={post.imageData}
                    alt={post.caption ?? "Workout post"}
                />

                <div className="flex flex-row gap-4">
                    <Form method="post">
                        <input type="hidden" name="intent" value="like" />
                        <button type="submit">
                            {post.likedByMe ? "🔥" : "🤍"} {post.likeCount}
                        </button>
                    </Form>
                    <p>🗨️ {post.commentCount}</p>
                    <Form method="post">
                        <input type="hidden" name="intent" value="repost" />
                        <button type="submit">🔗 {post.repostCount}</button>
                    </Form>
                </div>

                {isEditingCaption ? (
                    <Form
                        method="post"
                        className="flex gap-2 w-full max-w-md"
                        onSubmit={() => setIsEditingCaption(false)}
                    >
                        <input type="hidden" name="intent" value="editPost" />
                        <input
                            name="caption"
                            defaultValue={post.caption ?? ""}
                            className="flex-1 border-b bg-transparent text-neutral-200"
                            autoFocus
                        />
                        <button type="submit">Save</button>
                        <button type="button" onClick={() => setIsEditingCaption(false)}>
                            Cancel
                        </button>
                    </Form>
                ) : (
                    (post.caption || post.isOwnPost) && (
                        <div className="flex flex-row gap-2 w-full max-w-md items-center">
                            <Link to={`/profile/${post.userId}`} className="font-bold hover:underline">
                                {post.displayName}
                            </Link>
                            <p>{post.caption}</p>
                            {post.isOwnPost && (
                                <button onClick={() => setIsEditingCaption(true)} className="text-sm text-neutral-400">
                                    Edit
                                </button>
                            )}
                        </div>
                    )
                )}

                <CommentThread
                    postId={post.id}
                    comments={post.comments}
                    isOwnPost={post.isOwnPost}
                    currentUserId={userId}
                />

                <Form method="post" className="flex gap-2 w-full max-w-md">
                    <input type="hidden" name="intent" value="comment" />
                    <input
                        key={`comment-input-${post.comments.length}`}
                        name="text"
                        placeholder="Add a comment..."
                        className="flex-1 border-b bg-transparent text-neutral-200"
                    />
                    <button type="submit">Post</button>
                </Form>
            </div>

            <NavBar />
        </div>
    );
}