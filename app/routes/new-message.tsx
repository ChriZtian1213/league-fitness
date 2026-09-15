import type {Route} from "./+types/new-message";
import {Link, useLoaderData} from "react-router";
import {requireUserId} from "~/server/session.server";
import {searchMutualsByName} from "~/server/user.server";
import {NavBar} from "~/components/NavBar";

export async function loader({request}: Route.LoaderArgs) {
    const userId = await requireUserId(request);
    const url = new URL(request.url);
    const query = url.searchParams.get("q") ?? "";

    const mutuals = await searchMutualsByName(userId, query);
    return {query, mutuals};
}

export default function NewMessage() {
    const {query, mutuals} = useLoaderData<typeof loader>();

    return (
        <div className="min-h-screen bg-gray-800 text-neutral-200 pb-24">
            <div className="flex items-center px-4 pt-4">
                <Link to="/messages" className="text-2xl">←</Link>
            </div>
            <div className="font-bold text-3xl flex justify-center items-center p-3">
                New Message
            </div>

            <div className="flex justify-center px-4 mb-4">
                <input
                    name="q"
                    defaultValue={query}
                    placeholder="Search your mutuals..."
                    className="w-full max-w-md border rounded-md px-3 py-2 bg-transparent text-neutral-200"
                    autoFocus
                    autoComplete="off"
                    onChange={(e) => {
                        const url = new URL(window.location.href);
                        if (e.target.value) url.searchParams.set("q", e.target.value);
                        else url.searchParams.delete("q");
                        window.history.replaceState({}, "", url);
                    }}
                />
            </div>

            <div className="flex flex-col px-4 gap-2 max-w-md mx-auto">
                {mutuals.length === 0 && (
                    <p className="text-center text-neutral-400 py-4">
                        No mutual friends found{query ? ` for "${query}"` : ""}.
                    </p>
                )}
                {mutuals.map((u) => (
                    <Link
                        key={u.id}
                        to={`/messages/${u.id}`}
                        className="flex items-center gap-3 border-b border-neutral-700 py-2"
                    >
                        <img
                            src={u.profilePicture || "/favicon.ico"}
                            alt={`${u.displayName}'s profile picture`}
                            className="w-10 h-10 rounded-full object-cover border border-black"
                        />
                        <p className="font-bold">{u.displayName}</p>
                    </Link>
                ))}
            </div>

            <NavBar />
        </div>
    );
}