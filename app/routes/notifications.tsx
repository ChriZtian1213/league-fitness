import type {Route} from "./+types/notifications";
import {Form, Link, useLoaderData} from "react-router";
import {requireUserId} from "~/server/session.server";
import {getNotificationsForUser, markAllNotificationsRead} from "~/server/notification.server";
import {isFollowing} from "~/server/user.server";
import {NavBar} from "~/components/NavBar";
import {timeAgo} from "~/utils/timeAgo";

export async function loader({request}: Route.LoaderArgs) {
    const userId = await requireUserId(request);
    const notifications = await getNotificationsForUser(userId);
    await markAllNotificationsRead(userId);

    // For follow-type notifications, check whether you already follow them
    // back, so the button can say "Follow Back" or nothing at all if you do.
    const followBackStatus: Record<string, boolean> = {};
    for (const n of notifications) {
        if (n.type === "follow") {
            followBackStatus[n.fromUserId] = await isFollowing(userId, n.fromUserId);
        }
    }

    return {notifications, followBackStatus};
}

export async function action({request}: Route.ActionArgs) {
    const userId = await requireUserId(request);
    const formData = await request.formData();
    const targetUserId = formData.get("targetUserId");

    if (typeof targetUserId === "string") {
        const {followUser} = await import("~/server/user.server");
        await followUser(userId, targetUserId);
    }

    return {ok: true};
}

function describe(n: {type: string}) {
    switch (n.type) {
        case "like": return "liked your post";
        case "comment": return "commented on your post";
        case "follow": return "started following you";
        case "repost": return "reposted your post";
        default: return "interacted with your content";
    }
}

export default function Notifications() {
    const {notifications, followBackStatus} = useLoaderData<typeof loader>();

    return (
        <div className="min-h-screen bg-gray-800 text-neutral-200 pb-24">
            <div className="flex items-center mb-2 px-4">
                <Link to="/home" className="text-2xl">←</Link>
                <div className="flex-1 text-center font-bold text-3xl">
                    Notifications
                </div>
                <div className="w-6" />
            </div>

            <div className="flex flex-col px-4 gap-2 max-w-md mx-auto">
                {notifications.length === 0 && (
                    <p className="text-center py-8 text-neutral-400">No notifications yet.</p>
                )}
                {notifications.map((n) => (
                    <div
                        key={n.id}
                        className={`flex items-center gap-3 border-b border-neutral-700 py-3 ${!n.read ? "bg-neutral-700/40 rounded-md px-2" : ""}`}
                    >
                        <Link to={`/profile/${n.fromUserId}`} className="flex-shrink-0">
                            <img
                                src={n.fromProfilePicture || "/favicon.ico"}
                                alt={`${n.fromDisplayName}'s profile picture`}
                                className="w-11 h-11 rounded-full object-cover border border-black"
                            />
                        </Link>

                        <Link
                            to={n.postId ? `/post/${n.postId}` : `/profile/${n.fromUserId}`}
                            className="flex-1 min-w-0"
                        >
                            <p className="text-sm">
                                <span className="font-bold">{n.fromDisplayName}</span> {describe(n)}
                            </p>
                            {n.type === "comment" && n.commentPreview && (
                                <p className="text-xs text-neutral-400 truncate">"{n.commentPreview}"</p>
                            )}
                            <p className="text-xs text-neutral-500">{timeAgo(n.createdAt)}</p>
                        </Link>

                        {n.type === "follow" && !followBackStatus[n.fromUserId] && (
                            <Form method="post" className="flex-shrink-0">
                                <input type="hidden" name="targetUserId" value={n.fromUserId} />
                                <button
                                    type="submit"
                                    className="px-3 py-1.5 rounded-full border border-blue-500 bg-blue-500/20 text-blue-400 text-xs font-bold"
                                >
                                    Follow Back
                                </button>
                            </Form>
                        )}

                        {n.type !== "follow" && n.postImagePreview && (
                            <Link to={n.postId ? `/post/${n.postId}` : "#"} className="flex-shrink-0">
                                <img
                                    src={n.postImagePreview}
                                    alt="Post preview"
                                    className="w-11 h-11 object-cover border border-black rounded-md"
                                />
                            </Link>
                        )}
                    </div>
                ))}
            </div>

            <NavBar />
        </div>
    );
}