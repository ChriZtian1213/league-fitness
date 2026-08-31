import {useState} from 'react';
import type {Route} from "./+types/home"
import {Form, Link, useLoaderData} from "react-router"
import {requireUserId} from "~/server/session.server";
import {NavBar} from "~/components/NavBar";
import {getUserById, followUser, unfollowUser} from "~/server/user.server";
import {getFeed, toggleLike, addComment, toggleRepost, toggleCommentLike} from "~/server/post.server";
import CommentThread from "~/components/CommentThread";

export async function loader({request}: Route.LoaderArgs) {
    const userId = await requireUserId(request);
    const user = await getUserById(userId);
    const posts = await getFeed(userId);
    return {user, posts};
}

export async function action({request}: Route.ActionArgs) {
    const userId = await requireUserId(request);
    const formData = await request.formData();
    const intent = formData.get("intent");

    if (intent === "like") {
        const postId = formData.get("postId");
        if (typeof postId === "string") await toggleLike(userId, postId);
        return {ok: true};
    }

    if (intent === "comment") {
        const postId = formData.get("postId");
        const text = formData.get("text");
        const parentCommentId = formData.get("parentCommentId");
        if (typeof postId === "string" && typeof text === "string" && text.trim()) {
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
        const postId = formData.get("postId");
        const commentId = formData.get("commentId");
        if (typeof postId === "string" && typeof commentId === "string") {
            await toggleCommentLike(userId, postId, commentId);
        }
        return {ok: true};
    }

    if (intent === "repost") {
        const postId = formData.get("postId");
        if (typeof postId === "string") await toggleRepost(userId, postId);
        return {ok: true};
    }

    if (intent === "follow") {
        const targetUserId = formData.get("targetUserId");
        if (typeof targetUserId === "string") await followUser(userId, targetUserId);
        return {ok: true};
    }

    if (intent === "unfollow") {
        const targetUserId = formData.get("targetUserId");
        if (typeof targetUserId === "string") await unfollowUser(userId, targetUserId);
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

export default function Home() {
    const {user, posts} = useLoaderData<typeof loader>();

    return (
        <div className="min-h-screen bg-gray-800 text-neutral-200 pb-24">
            <div className="flex items-center mb-4">
                <div className="flex-1"></div>
                <div className="flex-1 text-center font-bold text-4xl p-3">
                    League Fitness
                </div>
                <div className="flex-1 flex justify-end pr-4">
                    <Form method="post" action="/logout">
                        <button type="submit">Logout</button>
                    </Form>
                </div>
            </div>

            <h2 className="px-4">Welcome back, {user?.displayName}!</h2>

            {posts.length === 0 && (
                <p className="text-center py-8">No posts yet — be the first!</p>
            )}

            {posts.map((post) => (
                <div key={post.id} className="flex flex-col items-center gap-3 border-t-2 border-black p-4">
                    <div className="flex flex-row gap-4 items-center w-full max-w-md justify-center">
                        <p className="font-bold">{post.displayName}</p>
                        <p>⚆ {timeAgo(post.createdAt)}</p>
                        {!post.isOwnPost && (
                            <Form method="post">
                                <input type="hidden" name="intent" value={post.isFollowing ? "unfollow" : "follow"} />
                                <input type="hidden" name="targetUserId" value={post.userId} />
                                <button type="submit" className={post.isFollowing ? "text-neutral-400" : "text-blue-400"}>
                                    {post.isFollowing ? "Following" : "Follow"}
                                </button>
                            </Form>
                        )}
                    </div>

                    <img
                        className="w-72 h-72 m-2 border-2 border-black object-cover"
                        src={post.imageData}
                        alt={post.caption ?? "Workout post"}
                    />

                    <div className="flex flex-row gap-4">
                        <Form method="post">
                            <input type="hidden" name="intent" value="like" />
                            <input type="hidden" name="postId" value={post.id} />
                            <button type="submit">
                                {post.likedByMe ? "🔥" : "🤍"} {post.likeCount}
                            </button>
                        </Form>
                        <p>🗨️ {post.commentCount}</p>
                        <Form method="post">
                            <input type="hidden" name="intent" value="repost" />
                            <input type="hidden" name="postId" value={post.id} />
                            <button type="submit">🔗 {post.repostCount}</button>
                        </Form>
                    </div>

                    {post.caption && (
                        <div className="flex flex-row gap-2 w-full max-w-md">
                            <p className="font-bold">{post.displayName}</p>
                            <p>{post.caption}</p>
                        </div>
                    )}

                    <CommentThread post={post} />

                    <Form method="post" className="flex gap-2 w-full max-w-md">
                        <input type="hidden" name="intent" value="comment" />
                        <input type="hidden" name="postId" value={post.id} />
                        <input
                            key={`comment-input-${post.id}-${post.comments.length}`}
                            name="text"
                            placeholder="Add a comment..."
                            className="flex-1 border-b bg-transparent text-neutral-200"
                        />
                        <button type="submit">Post</button>
                    </Form>
                </div>
            ))}

            <NavBar/>
        </div>
    );
}