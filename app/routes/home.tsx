import type {Route} from "./+types/home"
import {Form, Link, useLoaderData} from "react-router"
import type {PostEntry} from "~/types/post";
import {requireUserId} from "~/server/session.server";
import {NavBar} from "~/components/NavBar";
import {getUserById, followUser, unfollowUser, getResendCooldownSeconds} from "~/server/user.server";
import {
    getFeed, toggleLike, addComment, toggleRepost, toggleCommentLike, deleteComment, editComment, deletePost, editPost,
    type FeedScope
} from "~/server/post.server";
import {PostCard} from "~/components/PostCard";
import {CooldownTimer} from "~/components/CooldownTimer";
import {getUnreadNotificationCount} from "~/server/notification";

export async function loader({request}: Route.LoaderArgs) {
    const userId = await requireUserId(request);
    const user = await getUserById(userId);

    const url = new URL(request.url);
    const requestedScope = url.searchParams.get("scope");
    const scope: FeedScope = requestedScope === "global" ? "global" : "following";

    const posts = await getFeed(userId, scope);
    const cooldownSeconds = user && !user.emailVerified ? await getResendCooldownSeconds(userId) : 0;
    const unreadCount = await getUnreadNotificationCount(userId);

    return {user, posts, scope, cooldownSeconds, unreadCount};
}

export async function action({request}: Route.ActionArgs) {
    const userId = await requireUserId(request);
    const formData = await request.formData();
    const intent = formData.get("intent");

    const writeIntents = new Set([
        "like", "comment", "likeComment", "editComment", "deleteComment",
        "deletePost", "editPost", "repost", "follow", "unfollow",
    ]);

    if (writeIntents.has(intent as string)) {
        const user = await getUserById(userId);
        if (!user?.emailVerified) {
            return {error: "Please verify your email to do that."};
        }
    }

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
    const {cooldownSeconds, user, posts, scope, unreadCount} = useLoaderData<typeof loader>();

    return (
        <div className="min-h-screen bg-gray-800 text-neutral-200 pb-24">
            {user && !user.emailVerified && (
                <div className="bg-yellow-700 text-center py-2 text-sm flex flex-col items-center gap-1">
                    <p>Verify your email to like, comment, and post.</p>
                    <CooldownTimer initialSeconds={cooldownSeconds} />
                </div>
            )}
            <div className="flex items-center justify-between mb-4 px-4">
                <div className="w-16 flex justify-start">
                    <Link to="/notifications" className="relative text-2xl">
                        🔔
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full px-1.5">
                                {unreadCount > 9 ? "9+" : unreadCount}
                            </span>
                        )}
                    </Link>
                </div>
                <div className="text-center font-bold text-4xl p-3 whitespace-nowrap">
                    League Fitness
                </div>
                <Form method="post" action="/logout">
                    <button type="submit">Logout</button>
                </Form>
            </div>

            <h2 className="px-4">Welcome back, {user?.displayName}!</h2>

            <div className="flex justify-center gap-2 py-3 text-sm">
                <div className="flex border border-neutral-500 rounded-md overflow-hidden">
                    <Link
                        to="?scope=following"
                        className={`px-4 py-1 ${scope === "following" ? "bg-neutral-500" : ""}`}
                    >
                        Following
                    </Link>
                    <Link
                        to="?scope=global"
                        className={`px-4 py-1 ${scope === "global" ? "bg-neutral-500" : ""}`}
                    >
                        Global
                    </Link>
                </div>
            </div>

            {posts.length === 0 && (
                <p className="text-center py-8">
                    {scope === "following"
                        ? "No posts yet from people you follow — try Global, or check back later!"
                        : "No posts yet — be the first!"}
                </p>
            )}

            {posts.map((post: PostEntry) => (
                <PostCard key={post.id} post={post} currentUserId={user?.id ?? ""} />
            ))}

            <NavBar/>
        </div>
    );
}