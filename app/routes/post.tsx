import type {Route} from "./+types/post";
import {useState} from "react";
import {Form, Link, useLoaderData, redirect} from "react-router";
import {NavBar} from "~/components/NavBar";
import {requireUserId} from "~/server/session.server";
import {getPostById, toggleLike, toggleRepost, addComment, toggleCommentLike, deleteComment, editComment, editPost, deletePost} from "~/server/post.server";
import {getUserById} from "~/server/user.server";
import {CommentThread} from "~/components/CommentThread";
import {timeAgo} from "~/utils/timeAgo";
import {useNavigate} from "react-router";
import {PostImageCarousel} from "~/components/PostImageCarousel";

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

export default function PostDetail() {
    const {post, userId} = useLoaderData<typeof loader>();
    const [isEditingCaption, setIsEditingCaption] = useState(false);
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-800 text-neutral-200 pb-24">
            <div className="flex items-center px-4 pt-4">
                <button onClick={() => navigate(-1)} className="text-2xl">←</button>
            </div>
            <div className="flex flex-col items-center gap-3 p-4">
                <div className="flex flex-row gap-4 items-center">
                    <Link to={`/profile/${post.userId}`} className="font-bold hover:underline">
                        {post.displayName}
                    </Link>
                    <p>⚆ {timeAgo(post.createdAt)}</p>
                    {post.isOwnPost && (
                        <>
                            <button onClick={() => setIsEditingCaption(true)} className="text-sm text-neutral-400">
                                Edit
                            </button>
                            <Form
                                method="post"
                                onSubmit={(e) => {
                                    const button = e.currentTarget.querySelector('button[type="submit"]') as HTMLButtonElement | null;
                                    if (button) button.disabled = true;
                                }}
                            >
                                <input type="hidden" name="intent" value="deletePost" />
                                <button type="submit" className="text-red-400">
                                    Delete
                                </button>
                            </Form>
                        </>
                    )}
                </div>

                <PostImageCarousel imageUrls={post.imageUrls} caption={post.caption} />

                <div className="flex flex-row gap-3">
                    <Form method="post">
                        <input type="hidden" name="intent" value="like" />
                        <button
                            type="submit"
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-full border text-sm font-bold transition-colors
                                ${post.likedByMe
                                ? "bg-red-500/20 border-red-500 text-red-400"
                                : "border-neutral-500 text-neutral-300 hover:border-neutral-400"
                            }`}
                        >
                            {post.likedByMe ? "🔥" : "🤍"} {post.likeCount}
                        </button>
                    </Form>

                    <div className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-neutral-500 text-neutral-300 text-sm font-bold">
                        🗨️ {post.commentCount}
                    </div>

                    <Form method="post">
                        <input type="hidden" name="intent" value="repost" />
                        <button
                            type="submit"
                            className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-neutral-500 text-neutral-300 text-sm font-bold transition-colors hover:border-neutral-400"
                        >
                            🔗 {post.repostCount}
                        </button>
                    </Form>
                </div>

                {isEditingCaption ? (
                    <Form
                        method="post"
                        className="flex flex-col gap-2 w-full max-w-md"
                        onSubmit={() => setIsEditingCaption(false)}
                    >
                        <input type="hidden" name="intent" value="editPost" />
                        <textarea
                            name="caption"
                            defaultValue={post.caption ?? ""}
                            className="w-full border rounded-md px-3 py-2 bg-transparent text-neutral-200"
                            rows={3}
                            autoFocus
                            autoComplete="off"
                        />
                        <div className="flex gap-2">
                            <button type="submit" className="border rounded-md px-4 py-2 font-bold bg-green-700">
                                Save
                            </button>
                            <button type="button" onClick={() => setIsEditingCaption(false)} className="border rounded-md px-4 py-2">
                                Cancel
                            </button>
                        </div>
                    </Form>
                ) : (
                    (post.caption || post.isOwnPost) && (
                        <div className="w-full max-w-md">
                            <p className="leading-snug whitespace-pre-wrap">
                                <Link to={`/profile/${post.userId}`} className="font-bold hover:underline mr-1">
                                    {post.displayName}
                                </Link>
                                {post.caption}
                            </p>
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
                        className="flex-1 border rounded-md px-3 py-2 bg-transparent text-neutral-200"
                        autoComplete="off"
                    />
                    <button type="submit" className="border rounded-md px-4 py-2 font-bold bg-green-700">
                        Post
                    </button>
                </Form>
            </div>

            <NavBar />
        </div>
    );
}