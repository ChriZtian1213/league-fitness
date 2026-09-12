import type {Route} from "./+types/messages";
import {Link, useLoaderData} from "react-router";
import {requireUserId} from "~/server/session.server";
import {getConversations} from "~/server/message.server";
import {NavBar} from "~/components/NavBar";

export async function loader({request}: Route.LoaderArgs) {
    const userId = await requireUserId(request);
    const conversations = await getConversations(userId);
    return {conversations};
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

export default function Messages() {
    const {conversations} = useLoaderData<typeof loader>();

    return (
        <div className="min-h-screen bg-gray-800 text-neutral-200 pb-24">
            <div className="font-bold text-4xl flex justify-center items-center p-3">
                Messages
            </div>

            <div className="flex flex-col px-4 gap-2">
                {conversations.length === 0 && (
                    <p className="text-center py-8 text-neutral-400">No conversations yet.</p>
                )}
                {conversations.map((c) => (
                    <Link
                        key={c.otherUserId}
                        to={`/messages/${c.otherUserId}`}
                        className="flex items-center gap-3 border-b border-neutral-700 py-2"
                    >
                        <img
                            src={c.otherProfilePicture || "/favicon.ico"}
                            alt={`${c.otherDisplayName}'s profile picture`}
                            className="w-10 h-10 rounded-full object-cover border border-black"
                        />
                        <div className="flex-1 min-w-0">
                            <p className="font-bold">{c.otherDisplayName}</p>
                            <p className="text-sm text-neutral-400 truncate">{c.lastMessage}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <span className="text-xs text-neutral-400">{timeAgo(c.lastMessageAt)}</span>
                            {c.unreadCount > 0 && (
                                <span className="bg-red-500 text-white text-xs rounded-full px-1.5">
                                    {c.unreadCount}
                                </span>
                            )}
                        </div>
                    </Link>
                ))}
            </div>

            <NavBar />
        </div>
    );
}