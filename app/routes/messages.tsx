import type {Route} from "./+types/messages";
import {useState, useEffect} from "react";
import {Form, Link, useLoaderData, useActionData} from "react-router";
import {requireUserId} from "~/server/session.server";
import {getConversations, deleteConversation} from "~/server/message.server";
import {NavBar} from "~/components/NavBar";
import {timeAgo} from "~/utils/timeAgo";

export async function loader({request}: Route.LoaderArgs) {
    const userId = await requireUserId(request);
    const conversations = await getConversations(userId);
    return {conversations};
}

export async function action({request}: Route.ActionArgs) {
    const userId = await requireUserId(request);
    const formData = await request.formData();
    const otherUserIds = formData.getAll("otherUserId");

    for (const otherUserId of otherUserIds) {
        if (typeof otherUserId === "string") {
            await deleteConversation(userId, otherUserId);
        }
    }

    return {ok: true};
}

export default function Messages() {
    const {conversations} = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>();
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (actionData?.ok) {
            setIsSelecting(false);
            setSelectedIds(new Set());
        }
    }, [actionData]);

    function toggleSelected(otherUserId: string) {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(otherUserId)) next.delete(otherUserId);
            else next.add(otherUserId);
            return next;
        });
    }

    function cancelSelecting() {
        setIsSelecting(false);
        setSelectedIds(new Set());
    }

    return (
        <div className="min-h-screen bg-gray-800 text-neutral-200 pb-24 pt-4">
            <div className="flex items-center mb-2 px-4 gap-2">
                <button
                    onClick={() => (isSelecting ? cancelSelecting() : setIsSelecting(true))}
                    className="relative flex items-center gap-1 px-3 py-1.5 rounded-full border border-neutral-500 text-neutral-300 text-lg font-bold hover:border-neutral-400 transition-colors mr-2"
                >
                    {isSelecting ? "✕" : "🗑️"}
                </button>

                {isSelecting && (
                    <Form method="post">
                        {[...selectedIds].map((id) => (
                            <input key={id} type="hidden" name="otherUserId" value={id} />
                        ))}
                        <button
                            type="submit"
                            disabled={selectedIds.size === 0}
                            onClick={(e) => {
                                if (!window.confirm(`Delete ${selectedIds.size} conversation(s)? This cannot be undone.`)) {
                                    e.preventDefault();
                                }
                            }}
                            className="border rounded-md px-3 py-1.5 text-sm font-bold bg-red-700 disabled:opacity-40"
                        >
                            Delete {selectedIds.size > 0 ? `(${selectedIds.size})` : ""}
                        </button>
                    </Form>
                )}

                <div className="flex-1 text-center font-bold text-3xl">
                    Messages
                </div>

                <Link
                    to="/messages/new"
                    className="relative flex items-center gap-1 px-3 py-1.5 rounded-full border border-neutral-500 text-neutral-300 text-lg font-bold hover:border-neutral-400 transition-colors"
                >
                    + New
                </Link>
            </div>



            <div className="flex flex-col px-4 gap-2">
                {conversations.length === 0 && (
                    <p className="text-center py-8 text-neutral-400">No conversations yet.</p>
                )}
                {conversations.map((c) => (
                    <div key={c.otherUserId} className="flex items-center gap-2">
                        {isSelecting && (
                            <input
                                type="checkbox"
                                checked={selectedIds.has(c.otherUserId)}
                                onChange={() => toggleSelected(c.otherUserId)}
                                className="w-5 h-5"
                            />
                        )}
                        <Link
                            to={isSelecting ? "#" : `/messages/${c.otherUserId}`}
                            onClick={(e) => {
                                if (isSelecting) {
                                    e.preventDefault();
                                    toggleSelected(c.otherUserId);
                                }
                            }}
                            className="flex items-center gap-3 border-b border-neutral-700 py-2 flex-1"
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
                    </div>
                ))}
            </div>

            <NavBar />
        </div>
    );
}