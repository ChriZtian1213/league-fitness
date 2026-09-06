import type {Route} from "./+types/home"
import {Form, Link, useLoaderData} from "react-router"
import {requireUserId} from "~/server/session.server";
import {NavBar} from "~/components/NavBar";
import {getUserById, followUser, unfollowUser} from "~/server/user.server";
import {getFeed, toggleLike, addComment, toggleRepost, toggleCommentLike, deleteComment, editComment, deletePost, editPost} from "~/server/post.server";
import {PostCard} from "~/components/PostCard";

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

    if (intent === "editPost") {
        const postId = formData.get("postId");
        const caption = formData.get("caption");
        if (typeof postId === "string" && typeof caption === "string") {
            try {
                await editPost(userId, postId, caption.trim());
            } catch (err) {
                const message = err instanceof Error ? err.message : "Could not edit post.";
                return {error: message};
            }
        }
        return {ok: true};
    }

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

    if (intent === "editComment") {
        const postId = formData.get("postId");
        const commentId = formData.get("commentId");
        const text = formData.get("text");
        if (
            typeof postId === "string" &&
            typeof commentId === "string" &&
            typeof text === "string" &&
            text.trim()
        ) {
            try {
                await editComment(userId, postId, commentId, text.trim());
            } catch (err){
                const message = err instanceof Error ? err.message : "Could not edit comment";
                return {error: message};
            }
        }
        return {ok: true};
    }

    if (intent === "deleteComment"){
        const postId = formData.get("postId");
        const commentId = formData.get("commentId");
        if (typeof postId === "string" && typeof commentId === "string") {
            try {
                await deleteComment(userId, postId, commentId);
            } catch (error) {
                const message = error instanceof Error ? error.message : "Could not delete comment";
                return {error: message};
            }
        }
        return {ok: true};
    }

    if (intent === "deletePost") {
        const postId = formData.get("postId");
        if (typeof postId === "string"){
            try {
                await deletePost(userId, postId);
            } catch (error) {
                const message = error instanceof Error ? error.message : "Could not delete post";
                return {error: message};
            }
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

export default function Home() {
    const {user, posts} = useLoaderData<typeof loader>();

    return (
        <div className="min-h-screen bg-gray-800 text-neutral-200 pb-24">
            <div className="flex items-center mb-4">
                <div className="flex-1"></div>
                <div className="flex-1 text-center font-bold text-3xl p-3">
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
                <PostCard key={post.id} post={post} currentUserId={user?.id ?? ""} />
            ))}

            <NavBar/>
        </div>
    );
}