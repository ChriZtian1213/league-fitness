import type {Route} from "./+types/search";
import {Link, useFetcher, useSearchParams} from "react-router";
import {useEffect, useRef, useState} from "react";
import {requireUserId} from "~/server/session.server";
import {searchUsers, getFriendsList} from "~/server/user.server";
import {NavBar} from "~/components/NavBar";

export async function loader({request}: Route.LoaderArgs) {
    const userId = await requireUserId(request);
    const url = new URL(request.url);
    const query = url.searchParams.get("q") ?? "";

    if (!query.trim()) {
        const friends = await getFriendsList(userId);
        return {query, results: friends, isDefaultView: true};
    }

    const results = await searchUsers(query);
    return {query, results, isDefaultView: false};
}

export default function Search() {
    const [searchParams, setSearchParams] = useSearchParams();
    const fetcher = useFetcher<typeof loader>();
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [searchText, setSearchText] = useState(searchParams.get("q") ?? "");
    const isInternalUpdate = useRef(false);

    useEffect(() => {
        const timeout = setTimeout(() => {
            isInternalUpdate.current = true;
            const q = searchText;
            fetcher.load(`/search?q=${encodeURIComponent(q)}`);
        }, 250);

        return () => clearTimeout(timeout);
    }, [searchText]);

    const query = fetcher.data?.query ?? searchParams.get("q") ?? "";
    const results = fetcher.data?.results ?? [];
    const isDefaultView = fetcher.data?.isDefaultView ?? true;

    return (
        <div className="min-h-screen bg-gray-800 text-neutral-200 pb-24">
            <div className="font-bold text-4xl flex justify-center items-center p-3">
                League Fitness
            </div>
            <div className="font-bold text-xl flex justify-center items-center p-3">
                Search
            </div>

            <div className="flex justify-center px-4 mb-4">
                <input
                    ref={searchInputRef}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Search by username..."
                    className="w-full max-w-md border rounded-md px-3 py-2 bg-transparent text-neutral-200"
                    autoFocus
                    autoComplete="off"
                />
            </div>

            {isDefaultView && results.length > 0 && (
                <p className="text-xs text-neutral-500 text-center mb-2">Your friends</p>
            )}

            <div className="flex flex-col items-center gap-2 px-4">
                {!isDefaultView && query.trim() && results.length === 0 && (
                    <p>No users found for "{query}".</p>
                )}
                {isDefaultView && results.length === 0 && (
                    <p className="text-neutral-400 text-center py-4">
                        Search above to find people.
                    </p>
                )}

                {results.map((user) => (
                    <Link
                        key={user.id}
                        to={`/profile/${user.id}`}
                        className="flex items-center gap-3 w-full max-w-md border-b border-neutral-600 py-2"
                    >
                        <img
                            src={user.profilePicture || "/favicon.ico"}
                            alt={`${user.displayName}'s profile picture`}
                            className="w-10 h-10 rounded-full object-cover border border-black"
                        />
                        <p className="font-bold">{user.displayName}</p>
                    </Link>
                ))}
            </div>

            <NavBar />
        </div>
    );
}