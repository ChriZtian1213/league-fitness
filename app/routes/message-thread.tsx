import type {Route} from "./+types/message-thread";
import {Form, useLoaderData} from "react-router";
import {requireUserId} from "~/server/session.server";
import {getUserById} from "~/server/user.server";
import {getConversationMessages, markConversationRead, sendMessage} from "~/server/message.server";
import {NavBar} from "~/components/NavBar";

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
    const text = formData.get("text");

    if (typeof text === "string" && text.trim()) {
        await sendMessage(userId, otherUserId, text.trim());
    }

    return {ok: true};
}

export default function MessageThread() {
    const {messages, otherUser, userId} = useLoaderData<typeof loader>();

    return (
        <div className="min-h-screen bg-gray-800 text-neutral-200 pb-24 flex flex-col">
            <div className="font-bold text-2xl flex justify-center items-center p-3">
                {otherUser.displayName}
            </div>

            <div className="flex flex-col gap-2 px-4 flex-1 overflow-y-auto">
                {messages.map((m) => (
                    <div
                        key={m.id}
                        className={`max-w-xs px-3 py-2 rounded-lg ${
                            m.fromUserId === userId
                                ? "bg-blue-700 self-end"
                                : "bg-neutral-700 self-start"
                        }`}
                    >
                        {m.text}
                    </div>
                ))}
            </div>

            <Form method="post" className="flex gap-2 px-4 py-3">
                <input
                    key={messages.length}
                    name="text"
                    placeholder="Type a message..."
                    className="flex-1 border-b bg-transparent text-neutral-200 p-2"
                    autoFocus
                />
                <button type="submit" className="border rounded-md px-4 py-2 font-bold bg-green-700">
                    Send
                </button>
            </Form>

            <NavBar />
        </div>
    );
}