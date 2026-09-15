import type { Route } from "./+types/profile";
import {Form, Link, useLoaderData, useNavigate, useActionData} from "react-router";
import {useEffect, useState} from "react";
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
    changePassword,
    getUserProfilePicture
} from "~/server/user.server";
import {getPostsByUser, getPostCount, getRepostedPostsByUser} from "~/server/post.server";
import {ImageCropModal, type ShapeOption} from "~/components/ImageCropModal";
import {getPublicWorkoutDates} from "~/server/workout.server";
import {WorkoutCalendar} from "~/components/WorkoutCalendar";

const PROFILE_SHAPE_OPTIONS: ShapeOption[] = [
    {key: "circle", aspect: 1, cropShape: "round", label: "Profile Photo"},
];

function toDateStr(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

export async function loader({request, params}: Route.LoaderArgs) {
    const viewerId = await requireUserId(request);
    const profileUserId = params.userId ?? viewerId;
    const isOwnProfile = profileUserId === viewerId;

    const user = await getUserById(profileUserId);
    if (!user) {
        throw new Response("User not found", {status: 404});
    }

    const profilePicture = await getUserProfilePicture(profileUserId);

    const url = new URL(request.url);
    const now = new Date();
    const todayDateStr = toDateStr(now);
    const year = Number(url.searchParams.get("year")) || now.getFullYear();
    const month = Number(url.searchParams.get("month")) || now.getMonth() + 1;

    const posts = await getPostsByUser(profileUserId);
    const reposts = await getRepostedPostsByUser(profileUserId);
    const postCount = await getPostCount(profileUserId);
    const followerCount = await getFollowerCount(profileUserId);
    const followingCount = await getFollowingCount(profileUserId);
    const viewerIsFollowing = isOwnProfile ? false : await isFollowing(viewerId, profileUserId);
    const loggedDates = await getPublicWorkoutDates(viewerId, profileUserId);

    return {
        user: {...user, profilePicture}, posts, reposts, postCount, followerCount, followingCount,
        isOwnProfile, viewerIsFollowing, profileUserId,
        loggedDates, year, month, todayDateStr,
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
        const croppedImage = formData.get("profilePicture");

        const update: {displayName?: string; bio?: string; profilePicture?: string} = {};

        if (typeof displayName === "string" && displayName.trim()) {
            update.displayName = displayName.trim();
        }
        if (typeof bio === "string") {
            update.bio = bio.trim();
        }
        if (typeof croppedImage === "string" && croppedImage.startsWith("data:image")) {
            update.profilePicture = croppedImage;
        }

        await updateProfile(viewerId, update);
        return {ok: true};
    }

    if (intent === "changePassword") {
        const currentPassword = formData.get("currentPassword");
        const newPassword = formData.get("newPassword");
        const confirmNewPassword = formData.get("confirmNewPassword");

        if (
            typeof currentPassword !== "string" ||
            typeof newPassword !== "string" ||
            typeof confirmNewPassword !== "string"
        ) {
            return {error: "Invalid form data."};
        }

        if (newPassword !== confirmNewPassword) {
            return {error: "New passwords do not match."};
        }

        try {
            await changePassword(viewerId, currentPassword, newPassword);
            return {ok: true, passwordChanged: true};
        } catch (err) {
            const message = err instanceof Error ? err.message : "Could not change password.";
            return {error: message};
        }
    }

    return {error: "Unknown action"};
}

export default function Profile() {
    const {
        user, posts, reposts, postCount, followerCount, followingCount,
        isOwnProfile, viewerIsFollowing, loggedDates, year, month, todayDateStr,
    } = useLoaderData<typeof loader>();

    const actionData = useActionData<typeof action>();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<"posts" | "reposts" | "calendar">("posts");
    const [isEditing, setIsEditing] = useState(false);
    const [showPasswordForm, setShowPasswordForm] = useState(false);

    const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
    const [croppedImage, setCroppedImage] = useState<string | null>(null);

    function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => setRawImageSrc(reader.result as string);
        reader.readAsDataURL(file);
    }

    useEffect(() => {
        if (actionData?.ok) {
            setIsEditing(false);
        }
    }, [actionData]);

    return (
        <div className="min-h-screen bg-gray-800 text-neutral-200 pb-24">
            <div className="flex items-center mb-4 px-4">
                {isOwnProfile ? (
                    <button
                        onClick={() => setIsEditing((v) => !v)}
                        className="flex items-center justify-center w-9 h-9 rounded-full border border-neutral-500 text-neutral-300 hover:border-neutral-400 transition-colors"
                        aria-label="Edit profile settings"
                    >
                        ⛭
                    </button>
                ) : (
                    <button onClick={() => navigate(-1)} className="text-2xl w-9 flex justify-start" aria-label="Go back">
                        ←
                    </button>
                )}

                <div className="flex-1 text-center font-bold text-4xl p-3">
                    League Fitness
                </div>

                {isOwnProfile ? (
                    <Form method="post" action="/logout">
                        <button type="submit" className="text-red-400 font-bold">
                            Logout
                        </button>
                    </Form>
                ) : (
                    <div className="w-9" />
                )}
            </div>

            <div className="justify-center flex flex-row items-center gap-3 px-4 pb-4">
                <img
                    className="w-20 h-20 rounded-full m-2 border-2 border-black object-cover"
                    src={user?.profilePicture || "/favicon.ico"}
                    alt={`${user?.displayName ?? "User"}'s profile picture`}
                />
                <div className="flex flex-col p-2 min-w-0">
                    <div className="flex flex-col gap-1">
                        <p className="text-2xl font-bold leading-tight">{user?.displayName}</p>
                        {!isOwnProfile && (
                            <Form method="post">
                                <input
                                    type="hidden"
                                    name="intent"
                                    value={viewerIsFollowing ? "unfollow" : "follow"}
                                />
                                <button
                                    type="submit"
                                    className={`flex items-center gap-1 px-3 py-1 rounded-full border text-xs font-bold transition-colors w-fit
            ${viewerIsFollowing
                                        ? "border-neutral-500 text-neutral-400 hover:border-neutral-400"
                                        : "bg-blue-500/20 border-blue-500 text-blue-400"
                                    }`}
                                >
                                    {viewerIsFollowing ? "Following" : "Follow"}
                                </button>
                            </Form>
                        )}
                    </div>
                    {user?.bio && !isEditing && (
                        <p className="text-sm text-neutral-300 mt-1 max-w-xs">{user.bio}</p>
                    )}
                    <div className="flex flex-row gap-1.5 mt-1 text-sm">
                        <span>{postCount} <span className="text-neutral-400">posts</span></span>
                        {isOwnProfile ? (
                            <>
                                <Link to="/connections?tab=followers">{followerCount} <span className="text-neutral-400">followers</span></Link>
                                <Link to="/connections?tab=following">{followingCount} <span className="text-neutral-400">following</span></Link>
                            </>
                        ) : (
                            <>
                                <span>{followerCount} <span className="text-neutral-400">followers</span></span>
                                <span>{followingCount} <span className="text-neutral-400">following</span></span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {isOwnProfile && isEditing && (
                <Form
                    method="post"
                    className="flex flex-col gap-3 max-w-md mx-auto px-4 pb-4"
                    onSubmit={() => setRawImageSrc(null)}
                >
                    <input type="hidden" name="intent" value="editProfile" />
                    <input type="hidden" name="profilePicture" value={croppedImage ?? ""} />

                    <div className="flex flex-col gap-2">
                        <label className="text-sm text-neutral-400">Profile picture</label>

                        {croppedImage && (
                            <img
                                src={croppedImage}
                                alt="New profile picture preview"
                                className="w-24 h-24 rounded-full object-cover border border-black"
                            />
                        )}

                        <label className="text-sm">
                            <span className="inline-block cursor-pointer border border-neutral-500 rounded-md bg-neutral-700 text-neutral-200 font-bold px-4 py-2 hover:bg-neutral-600">
                                {croppedImage ? "Choose a different photo" : "Choose photo"}
                            </span>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                        </label>
                    </div>

                    <label className="text-sm text-neutral-400">
                        Display name
                        <input
                            name="displayName"
                            defaultValue={user?.displayName ?? ""}
                            className="block w-full mt-1 border rounded-md px-3 py-2 bg-transparent text-neutral-200"
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

                    <label className="flex items-center gap-2 text-sm text-neutral-400">
                        <input
                            type="checkbox"
                            name="calendarPublic"
                            defaultChecked={user?.calendarPublic ?? true}
                        />
                        Make my workout calendar public
                    </label>

                    <button type="submit" className="border rounded-md px-4 py-2 font-bold bg-green-700">
                        Save Changes
                    </button>
                </Form>
            )}

            {isOwnProfile && isEditing && (
                <div className="max-w-md mx-auto px-4 pb-4">
                    <Link
                        to="/reset-password"
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-neutral-500 text-neutral-300 text-sm font-bold hover:border-neutral-400 transition-colors w-fit"
                    >
                        Change password
                    </Link>
                </div>
            )}

            <div className="flex flex-row flex-wrap gap-4 pb-4 justify-center text-xl border-b border-black">
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
                {(isOwnProfile || loggedDates !== null) && (
                    <button
                        onClick={() => setActiveTab("calendar")}
                        className={activeTab === "calendar" ? "underline font-bold" : ""}
                    >
                        Calendar
                    </button>
                )}
            </div>

            {activeTab === "posts" && (
                <div className="grid grid-cols-3 gap-0.5 p-1">
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
                                alt={post.caption ?? "Repost"}
                            />
                        </Link>
                    ))}
                </div>
            )}

            {activeTab === "calendar" && loggedDates !== null && (
                <div className="py-4">
                    <WorkoutCalendar
                        year={year}
                        month={month}
                        loggedDates={loggedDates}
                        selectedDate={null}
                        today={todayDateStr}
                        clearTo="?"
                        {...(isOwnProfile ? {dayLinkBase: "/log"} : {})}
                    />
                </div>
            )}

            {rawImageSrc && (
                <ImageCropModal
                    imageSrc={rawImageSrc}
                    shapeOptions={PROFILE_SHAPE_OPTIONS}
                    maxDimension={300}
                    onCancel={() => setRawImageSrc(null)}
                    onCropDone={(dataUrl) => {
                        setCroppedImage(dataUrl);
                        setRawImageSrc(null);
                    }}
                />
            )}

            <NavBar />
        </div>
    );
}