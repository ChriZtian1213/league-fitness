import type {Route} from "./+types/connections";
import {Form, Link, useLoaderData} from "react-router";
import {requireUserId} from "~/server/session.server";
import {getFollowerList, getFollowingList, getFriendsList, followUser, unfollowUser} from "~/server/user.server";
import {NavBar} from "~/components/NavBar";
import {useState, useEffect} from "react";

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

export async function action({request}: Route.ActionArgs) {
    const userId = await requireUserId(request);
    const formData = await request.formData();
    const targetUserId = formData.get("targetUserId");
    const intent = formData.get("intent");

    if (typeof targetUserId === "string") {
        if (intent === "follow") await followUser(userId, targetUserId);
        if (intent === "unfollow") await unfollowUser(userId, targetUserId);
    }

    return {ok: true};
}

export default function Connections() {
    const {users: serverUsers, tab} = useLoaderData<typeof loader>();
    const [users, setUsers] = useState(serverUsers);

    useEffect(() => {
        setUsers(serverUsers);
    }, [tab]);

    function toggleFollowLocally(userId: string, nowFollowing: boolean) {
        setUsers((prev) =>
            prev.map((u) => (u.id === userId ? {...u, isFollowedByMe: nowFollowing} : u))
        );
    }

    return (
        <div className="min-h-screen bg-gray-800 text-neutral-200 pb-24">
            <div className="flex items-center mb-2 px-4">
                <Link to="/profile" className="text-2xl">←</Link>
                <div className="flex-1 text-center font-bold text-3xl">
                    Connections
                </div>
                <div className="w-6" />
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
                    <div key={u.id} className="flex items-center gap-3 border-b border-neutral-700 py-2">
                        <Link to={`/profile/${u.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                            <img
                                src={u.profilePicture || "/favicon.ico"}
                                alt={`${u.displayName}'s profile picture`}
                                className="w-10 h-10 rounded-full object-cover border border-black flex-shrink-0"
                            />
                            <p className="font-bold truncate">{u.displayName}</p>
                        </Link>

                        <Form
                            method="post"
                            className="flex-shrink-0"
                            onSubmit={() => toggleFollowLocally(u.id, !u.isFollowedByMe)}
                        >
                            <input type="hidden" name="targetUserId" value={u.id} />
                            <input type="hidden" name="intent" value={u.isFollowedByMe ? "unfollow" : "follow"} />
                            <button
                                type="submit"
                                className={`px-3 py-1.5 rounded-full border text-xs font-bold transition-colors
                                    ${u.isFollowedByMe
                                    ? "border-neutral-500 text-neutral-400"
                                    : "bg-blue-500/20 border-blue-500 text-blue-400"
                                }`}
                            >
                                {u.isFollowedByMe ? "Following" : "Follow"}
                            </button>
                        </Form>
                    </div>
                ))}
            </div>

            <NavBar />
        </div>
    );
}