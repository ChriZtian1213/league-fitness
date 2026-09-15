import type {Route} from "./+types/message-thread";
import {Form, Link, useLoaderData} from "react-router";
import {requireUserId} from "~/server/session.server";
import {getUserById} from "~/server/user.server";
import {getConversationMessages, markConversationRead, sendMessage, deleteMessage} from "~/server/message.server";
import {NavBar} from "~/components/NavBar";
import {useState} from "react";

export async function loader({request, params}: Route.LoaderArgs) {
    const userId = await requireUserId(request);
    const otherUserId = (params as {userId: string}).userId;

    const otherUser = await getUserById(otherUserId);
    if (!otherUser) {
        throw new Response("User not found", {status: 404});
    }

    const messages = await getConversationMessages(userId, otherUserId);
    await markConversationRead(userId, otherUserId);

    return {messages, otherUser, userId};
}

export async function action({request, params}: Route.ActionArgs) {
    const userId = await requireUserId(request);
    const otherUserId = (params as {userId: string}).userId;
    const formData = await request.formData();
    const intent = formData.get("intent");

    if (intent === "delete") {
        const messageId = formData.get("messageId");
        if (typeof messageId === "string") {
            try {
                await deleteMessage(userId, messageId);
            } catch (err) {
                const message = err instanceof Error ? err.message : "Could not delete message.";
                return {error: message};
            }
        }
        return {ok: true};
    }

    const text = formData.get("text");
    if (typeof text === "string" && text.trim()) {
        await sendMessage(userId, otherUserId, text.trim());
    }

    return {ok: true};
}

export default function MessageThread() {
    const {messages, otherUser, userId} = useLoaderData<typeof loader>();
    const [activeMessageId, setActiveMessageId] = useState<string | null>(null);

    return (
        <div className="min-h-screen bg-gray-800 text-neutral-200 pb-24 flex flex-col">
            <div className="flex items-center mb-2 px-4">
                <Link to="/messages" className="text-2xl">←</Link>
                <div className="flex-1 flex items-center justify-center gap-2 py-1">
                    <Link to={`/profile/${otherUser.id}`}>
                        <img
                            src={otherUser.profilePicture || "/favicon.ico"}
                            alt={`${otherUser.displayName}'s profile picture`}
                            className="w-8 h-8 rounded-full object-cover border border-black"
                        />
                    </Link>
                    <p className="font-bold text-2xl">{otherUser.displayName}</p>
                </div>
                <div className="w-6" />
            </div>

            <div className="flex flex-col gap-2 px-4 flex-1 overflow-y-auto">
                {messages.map((m) => {
                    const isMine = m.fromUserId === userId;
                    const isActive = activeMessageId === m.id;

                    return (
                        <div
                            key={m.id}
                            className={`flex items-center gap-1 ${isMine ? "self-end flex-row-reverse" : "self-start"}`}
                        >
                            <button
                                type="button"
                                onClick={() => isMine && setActiveMessageId(isActive ? null : m.id)}
                                className={`max-w-xs px-3 py-2 rounded-lg text-left ${
                                    isMine ? "bg-blue-700" : "bg-neutral-700"
                                }`}
                            >
                                {m.text}
                            </button>
                            {isMine && isActive && (
                                <Form
                                    method="post"
                                    onSubmit={() => setActiveMessageId(null)}
                                >
                                    <input type="hidden" name="intent" value="delete" />
                                    <input type="hidden" name="messageId" value={m.id} />
                                    <button
                                        type="submit"
                                        className="text-red-400 text-xs px-1"
                                        aria-label="Delete message"
                                    >
                                        X
                                    </button>
                                </Form>
                            )}
                        </div>
                    );
                })}
            </div>

            <Form method="post" className="flex gap-2 px-4 py-3">
                <input
                    key={messages.length}
                    name="text"
                    placeholder="Type a message..."
                    className="flex-1 border-b bg-transparent text-neutral-200 p-2"
                    autoFocus
                    autoComplete="off"
                />
                <button type="submit" className="border rounded-md px-4 py-2 font-bold bg-green-700">
                    Send
                </button>
            </Form>

            <NavBar />
        </div>
    );
}