import type {Route} from "./+types/post";
import {Form, useLoaderData} from "react-router";
import {NavBar} from "~/components/NavBar";
import {requireUserId} from "~/server/session.server";
import {getPostById, toggleLike, toggleRepost, addComment} from "~/server/post.server";
import {getUserById} from "~/server/user.server";

export async function loader({request, params}: Route.LoaderArgs) {
    const userId = await requireUserId(request);
    const postId = (params as {postId: string}).postId;

    const post = await getPostById(userId, postId);
    if (!post) {
        throw new Response("Post not found", {status: 404});
    }

    return {post};
}

export async function action({request, params}: Route.ActionArgs) {
    const userId = await requireUserId(request);
    const postId = (params as {postId: string}).postId;
    const formData = await request.formData();
    const intent = formData.get("intent");

    if (intent === "like") {
        await toggleLike(userId, postId);
        return {ok: true};
    }

    if (intent === "repost") {
        await toggleRepost(userId, postId);
        return {ok: true};
    }

    if (intent === "comment") {
        const text = formData.get("text");
        if (typeof text === "string" && text.trim()) {
            const user = await getUserById(userId);
            if (user) await addComment(userId, user.displayName, postId, text.trim());
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
    const {post} = useLoaderData<typeof loader>();

    return (
        <div className="min-h-screen bg-gray-800 text-neutral-200 pb-24">
            <div className="flex flex-col items-center gap-3 p-4">
                <div className="flex flex-row gap-4 items-center">
                    <p className="font-bold">{post.displayName}</p>
                    <p>⚆ {timeAgo(post.createdAt)}</p>
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

                {post.caption && (
                    <div className="flex flex-row gap-2 w-full max-w-md">
                        <p className="font-bold">{post.displayName}</p>
                        <p>{post.caption}</p>
                    </div>
                )}

                <div className="w-full max-w-md flex flex-col gap-2">
                    {post.comments
                        .filter((c) => c.parentCommentId === null)
                        .map((comment) => (
                            <div key={comment.id} className="flex gap-2">
                                <p className="font-bold">{comment.displayName}</p>
                                <p>{comment.text}</p>
                                {comment.edited && (
                                    <span className="text-xs text-neutral-500">(edited)</span>
                                )}
                            </div>
                        ))}
                </div>

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