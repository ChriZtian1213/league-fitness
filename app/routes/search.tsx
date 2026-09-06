import type {Route} from "./+types/search";
import {Form, Link, useLoaderData} from "react-router";
import {requireUserId} from "~/server/session.server";
import {searchUsers} from "~/server/user.server";
import {NavBar} from "~/components/NavBar";

export async function loader({request}: Route.LoaderArgs) {
    await requireUserId(request);

    const url = new URL(request.url);
    const query = url.searchParams.get("q") ?? "";

    const results = query.trim() ? await searchUsers(query) : [];

    return {query, results};
}

export default function Search() {
    const {query, results} = useLoaderData<typeof loader>();

    return (
        <div className="min-h-screen bg-gray-800 text-neutral-200 pb-24">
            <div className="font-bold text-4xl flex justify-center items-center p-3">
                Search
            </div>

            <Form method="get" className="flex justify-center px-4 mb-6">
                <input
                    name="q"
                    defaultValue={query}
                    placeholder="Search by username..."
                    className="w-full max-w-md border-b bg-transparent text-neutral-200 p-2"
                    autoFocus
                />
            </Form>

            <div className="flex flex-col items-center gap-2 px-4">
                {query.trim() && results.length === 0 && (
                    <p>No users found for "{query}".</p>
                )}

                {results.map((user) => (
                    <Link
                        key={user.id}
                        to={`/profile/${user.id}`}
                        className="flex items-center gap-3 w-full max-w-md border-b border-neutral-600 py-2"
                    >
                        <img
                            src="/favicon.ico"
                            alt={`${user.displayName}'s profile picture`}
                            className="w-10 h-10 rounded-full border border-black"
                        />
                        <p className="font-bold">{user.displayName}</p>
                    </Link>
                ))}
            </div>

            <NavBar />
        </div>
    );
}