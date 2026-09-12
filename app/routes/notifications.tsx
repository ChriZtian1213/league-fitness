import type {Route} from "./+types/notifications";
import {Link, useLoaderData} from "react-router";
import {requireUserId} from "~/server/session.server";
import {getNotificationsForUser, markAllNotificationsRead} from "~/server/notification";
import {NavBar} from "~/components/NavBar";

export async function loader({request}: Route.LoaderArgs) {
    const userId = await requireUserId(request);
    const notifications = await getNotificationsForUser(userId);
    await markAllNotificationsRead(userId);
    return {notifications};
}

function describe(n: {type: string; fromDisplayName: string}) {
    switch (n.type) {
        case "like": return `${n.fromDisplayName} liked your post`;
        case "comment": return `${n.fromDisplayName} commented on your post`;
        case "follow": return `${n.fromDisplayName} started following you`;
        default: return `${n.fromDisplayName} interacted with your content`;
    }
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

export default function Notifications() {
    const {notifications} = useLoaderData<typeof loader>();

    return (
        <div className="min-h-screen bg-gray-800 text-neutral-200 pb-24">
            <div className="font-bold text-4xl flex justify-center items-center p-3">
                Notifications
            </div>

            <div className="flex flex-col px-4 gap-2">
                {notifications.length === 0 && (
                    <p className="text-center py-8 text-neutral-400">No notifications yet.</p>
                )}
                {notifications.map((n) => (
                    <Link
                        key={n.id}
                        to={n.postId ? `/post/${n.postId}` : `/profile/${n.fromUserId}`}
                        className={`flex justify-between items-center border-b border-neutral-700 py-2 ${!n.read ? "bg-neutral-700/40" : ""}`}
                    >
                        <span>{describe(n)}</span>
                        <span className="text-xs text-neutral-400">{timeAgo(n.createdAt)}</span>
                    </Link>
                ))}
            </div>

            <NavBar />
        </div>
    );
}