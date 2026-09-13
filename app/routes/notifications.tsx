import type {Route} from "./+types/notifications";
import {Link, useLoaderData} from "react-router";
import {requireUserId} from "~/server/session.server";
import {getNotificationsForUser, markAllNotificationsRead} from "~/server/notification.server";
import {NavBar} from "~/components/NavBar";
import {timeAgo} from "~/utils/timeAgo";

export async function loader({request}: Route.LoaderArgs) {
    const userId = await requireUserId(request);
    const notifications = await getNotificationsForUser(userId);
    await markAllNotificationsRead(userId);
    return {notifications};
}

function describe(n: {type: string}) {
    switch (n.type) {
        case "like": return "liked your post";
        case "comment": return "commented on your post";
        case "follow": return "started following you";
        default: return "interacted with your content";
    }
}

export default function Notifications() {
    const {notifications} = useLoaderData<typeof loader>();

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
                    <Link
                        key={n.id}
                        to={n.postId ? `/post/${n.postId}` : `/profile/${n.fromUserId}`}
                        className={`flex items-center gap-3 border-b border-neutral-700 py-3 ${!n.read ? "bg-neutral-700/40 rounded-md px-2" : ""}`}
                    >
                        <img
                            src={n.fromProfilePicture || "/favicon.ico"}
                            alt={`${n.fromDisplayName}'s profile picture`}
                            className="w-11 h-11 rounded-full object-cover border border-black flex-shrink-0"
                        />

                        <div className="flex-1 min-w-0">
                            <p className="text-sm">
                                <span className="font-bold">{n.fromDisplayName}</span> {describe(n)}
                            </p>
                            {n.type === "comment" && n.commentPreview && (
                                <p className="text-xs text-neutral-400 truncate">"{n.commentPreview}"</p>
                            )}
                            <p className="text-xs text-neutral-500">{timeAgo(n.createdAt)}</p>
                        </div>

                        {n.type !== "follow" && n.postImagePreview && (
                            <img
                                src={n.postImagePreview}
                                alt="Post preview"
                                className="w-11 h-11 object-cover border border-black rounded-md flex-shrink-0"
                            />
                        )}
                    </Link>
                ))}
            </div>

            <NavBar />
        </div>
    );
}