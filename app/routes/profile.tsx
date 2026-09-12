import type { Route } from "./+types/profile";
import {Form, Link, useLoaderData} from "react-router";
import {useState} from "react";
import {NavBar} from "~/components/NavBar";
import {requireUserId} from "~/server/session.server";
import {
    getUserById,
    followUser,
    unfollowUser,
    getFollowerCount,
    getFollowingCount,
    isFollowing,
    updateProfile,
} from "~/server/user.server";
import {getPostsByUser, getPostCount, getRepostedPostsByUser} from "~/server/post.server";

export async function loader({request, params}: Route.LoaderArgs) {
    const viewerId = await requireUserId(request);
    const profileUserId = params.userId ?? viewerId;
    const isOwnProfile = profileUserId === viewerId;

    const user = await getUserById(profileUserId);
    if (!user) {
        throw new Response("User not found", {status: 404});
    }

    const [posts, reposts, postCount, followerCount, followingCount, viewerIsFollowing] =
        await Promise.all([
            getPostsByUser(profileUserId),
            getRepostedPostsByUser(profileUserId),
            getPostCount(profileUserId),
            getFollowerCount(profileUserId),
            getFollowingCount(profileUserId),
            isOwnProfile ? Promise.resolve(false) : isFollowing(viewerId, profileUserId),
        ]);

    return {
        user, posts, reposts, postCount, followerCount, followingCount,
        isOwnProfile, viewerIsFollowing, profileUserId,
    };
}

export async function action({request, params}: Route.ActionArgs) {
    const viewerId = await requireUserId(request);
    const formData = await request.formData();
    const intent = formData.get("intent");
    const targetUserId = params.userId ?? viewerId;

    if (intent === "follow") {
        await followUser(viewerId, targetUserId);
        return {ok: true};
    }

    if (intent === "unfollow") {
        await unfollowUser(viewerId, targetUserId);
        return {ok: true};
    }

    if (intent === "editProfile") {
        const displayName = formData.get("displayName");
        const bio = formData.get("bio");
        const image = formData.get("profilePicture");

        const update: {displayName?:string; bio?: string; profilePicture?: string} = {};

        if (typeof displayName === "string" && displayName.trim()){
            update.displayName = displayName.trim();
        }

        if (typeof bio === "string") {
            update.bio = bio.trim();
        }

        if (image instanceof File && image.size > 0) {
            if (image.size > 5 * 1024 * 1024) {
                return {error: "Image must be under 5MB."};
            }
            const arrayBuffer = await image.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString("base64");
            update.profilePicture = `data:${image.type};base64,${base64}`;
        }

        await updateProfile(viewerId, update);
        return {ok: true};
    }

    return {error: "Unknown action"};
}

export default function Profile() {
    const {
        user, posts, reposts, postCount, followerCount, followingCount,
        isOwnProfile, viewerIsFollowing,
    } = useLoaderData<typeof loader>();

    const [activeTab, setActiveTab] = useState<"posts" | "saved" | "reposts">("posts");
    const [isEditing, setIsEditing] = useState(false);

    return (
        <div className="min-h-screen bg-gray-800 text-neutral-200 pb-24">
            <div className="flex items-center mb-4">
                <div className="flex-1"></div>
                <div className="flex-1 text-center font-bold text-3xl p-3">
                    League Fitness
                </div>
                <div className="flex-1 flex justify-end">
                    {isOwnProfile && (
                        <Form method="post" action="/logout">
                            <button type="submit">Logout</button>
                        </Form>
                    )}
                </div>
            </div>

            <div className="flex flex-row justify-center items-center">
                <img
                    className="w-32 h-32 rounded-full m-2 border-2 border-black object-cover"
                    src={user?.profilePicture || "/favicon.ico"}
                    alt={`${user?.displayName ?? "User"}'s profile picture`}
                />
                <div className="flex flex-col p-8">
                    <p className="text-3xl font-bold">{user?.displayName}</p>
                    <p className="text-sm text-neutral-400">@{user?.username}</p>
                    {user?.bio && !isEditing && (
                        <p className="text-sm text-neutral-300 mt-1 max-w-xs">{user.bio}</p>
                    )}
                    <div className="flex flex-row gap-2 mt-1">
                        <p>{postCount} posts</p>
                        <p>{followerCount} followers</p>
                        <p>{followingCount} following</p>
                    </div>
                </div>

                {isOwnProfile ? (
                    <button className="text-3xl" onClick={() => setIsEditing((v) => !v)}>
                        ⛭ {isEditing ? "Close" : "Edit"}
                    </button>
                ) : (
                    <Form method="post">
                        <input
                            type="hidden"
                            name="intent"
                            value={viewerIsFollowing ? "unfollow" : "follow"}
                        />
                        <button
                            type="submit"
                            className={`px-4 py-2 rounded-md border ${
                                viewerIsFollowing ? "text-neutral-400" : "text-blue-400"
                            }`}
                        >
                            {viewerIsFollowing ? "Following" : "Follow"}
                        </button>
                    </Form>
                )}
            </div>

            {isOwnProfile && isEditing && (
                <Form
                    method="post"
                    encType="multipart/form-data"
                    className="flex flex-col gap-3 max-w-md mx-auto px-4 pb-4"
                    onSubmit={() => setIsEditing(false)}
                >
                    <input type="hidden" name="intent" value="editProfile" />

                    <label className="text-sm text-neutral-400">
                        Profile picture
                        <input
                            type="file"
                            name="profilePicture"
                            accept="image/*"
                            className="block mt-1 text-sm"
                        />
                    </label>

                    <label className="text-sm text-neutral-400">
                        Bio
                        <textarea
                            name="bio"
                            defaultValue={user?.bio ?? ""}
                            placeholder="Tell people about yourself..."
                            className="block w-full mt-1 border rounded-md p-2 bg-transparent text-neutral-200"
                            rows={3}
                            maxLength={200}
                        />
                    </label>

                    <button type="submit" className="border rounded-md px-4 py-2 font-bold bg-green-700">
                        Save Changes
                    </button>
                </Form>
            )}

            <div className="flex flex-row gap-4 pb-4 justify-center text-xl border-b border-black">
                <button
                    onClick={() => setActiveTab("posts")}
                    className={activeTab === "posts" ? "underline font-bold" : ""}
                >
                    Posts
                </button>
                <button
                    onClick={() => setActiveTab("reposts")}
                    className={activeTab === "reposts" ? "underline font-bold" : ""}
                >
                    Reposts
                </button>
            </div>

            {activeTab === "posts" && (
                <div className="grid grid-cols-3 gap-1 p-1">
                    {posts.length === 0 && (
                        <p className="col-span-3 text-center py-8">No posts yet.</p>
                    )}
                    {posts.map((post) => (
                        <Link key={post.id} to={`/post/${post.id}`}>
                            <img
                                src={post.imageData}
                                className="w-full aspect-square object-cover"
                                alt={post.caption ?? "Post"}
                            />
                        </Link>
                    ))}
                </div>
            )}

            {activeTab === "reposts" && (
                <div className="grid grid-cols-3 gap-1 p-1">
                    {reposts.length === 0 && (
                        <p className="col-span-3 text-center py-8">No reposts yet.</p>
                    )}
                    {reposts.map((post) => (
                        <Link key={post.id} to={`/post/${post.id}`}>
                            <img
                                src={post.imageData}
                                className="w-full aspect-square object-cover"
                                alt="Repost"
                            />
                        </Link>
                    ))}
                </div>
            )}

            <NavBar />
        </div>
    );
}