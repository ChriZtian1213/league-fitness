import type {Route} from "./+types/connections";
import {Link, useLoaderData} from "react-router";
import {requireUserId} from "~/server/session.server";
import {getFollowerList, getFollowingList, getFriendsList} from "~/server/user.server";
import {NavBar} from "~/components/NavBar";

export async function loader({request}: Route.LoaderArgs) {
    const userId = await requireUserId(request);
    const url = new URL(request.url);

    const requestedTab = url.searchParams.get("tab");
    const tab: "followers" | "following" | "friends" =
        requestedTab === "following" || requestedTab === "friends" ? requestedTab : "followers";

    const users =
        tab === "followers" ? await getFollowerList(userId) :
            tab === "following" ? await getFollowingList(userId) :
                await getFriendsList(userId);

    return {users, tab};
}

export default function Connections() {
    const {users, tab} = useLoaderData<typeof loader>();

    return (
        <div className="min-h-screen bg-gray-800 text-neutral-200 pb-24">
            <div className="flex items-center px-4 pt-4">
                <Link to="/profile" className="text-2xl">←</Link>
            </div>

            <div className="font-bold text-3xl flex justify-center items-center p-3">
                Connections
            </div>

            <div className="flex justify-center mb-4 text-sm">
                <div className="flex border border-neutral-500 rounded-md overflow-hidden">
                    <Link to="?tab=followers" className={`px-3 py-1.5 ${tab === "followers" ? "bg-neutral-500" : ""}`}>
                        Followers
                    </Link>
                    <Link to="?tab=following" className={`px-3 py-1.5 ${tab === "following" ? "bg-neutral-500" : ""}`}>
                        Following
                    </Link>
                    <Link to="?tab=friends" className={`px-3 py-1.5 ${tab === "friends" ? "bg-neutral-500" : ""}`}>
                        Friends
                    </Link>
                </div>
            </div>

            <div className="flex flex-col px-4 gap-2 max-w-md mx-auto">
                {users.length === 0 && (
                    <p className="text-center py-8 text-neutral-400">
                        {tab === "followers" && "No followers yet."}
                        {tab === "following" && "Not following anyone yet."}
                        {tab === "friends" && "No mutual friends yet."}
                    </p>
                )}
                {users.map((u) => (
                    <Link
                        key={u.id}
                        to={`/profile/${u.id}`}
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