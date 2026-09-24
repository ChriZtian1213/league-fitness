import { PostImageCarousel } from "~/components/PostImageCarousel";
import { timeAgo } from "~/utils/timeAgo";

type GuestPost = Awaited<ReturnType<typeof import("~/server/post.server").getPublicAnnouncementPosts>>[number];

export function GuestPostCard({post}: {post: GuestPost}) {
    return (
        <div className="flex flex-col items-center gap-3 border-t-2 border-black p-4">
            <div className="flex flex-row gap-4 items-center w-full max-w-md justify-center">
                <img
                    src={post.profilePicture || "/favicon.ico"}
                    alt={`${post.displayName}'s profile picture`}
                    className="w-8 h-8 rounded-full object-cover border border-black"
                />
                <span className="font-bold">{post.displayName}</span>
                <p>⚆ {timeAgo(post.createdAt)}</p>
            </div>

            <PostImageCarousel imageUrls={post.imageUrls} caption={post.caption} />

            <div className="flex flex-row gap-3">
                <div className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-neutral-500 text-neutral-300 text-sm font-bold">
                    🤍 {post.likeCount}
                </div>
                <div className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-neutral-500 text-neutral-300 text-sm font-bold">
                    🗨️ {post.commentCount}
                </div>
            </div>

            {post.caption && (
                <div className="w-full max-w-md">
                    <p className="leading-snug whitespace-pre-wrap">
                        <span className="font-bold mr-1">{post.displayName}</span>
                        {post.caption}
                    </p>
                </div>
            )}
        </div>
    );
}