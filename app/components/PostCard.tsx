import {useState} from "react";
import {Form, Link} from "react-router";
import {CommentThread} from "~/components/CommentThread";
import type {getFeed} from "~/server/post.server";

type FeedPost = Awaited<ReturnType<typeof getFeed>>[number];

function timeAgo(date: Date) {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return "Now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}hr`;
    return `${Math.floor(hours / 24)}d`;
}

export function PostCard({post, currentUserId}: {post: FeedPost; currentUserId: string}) {
    const [isEditingCaption, setIsEditingCaption] = useState(false);

    return (
        <div className="flex flex-col items-center gap-3 border-t-2 border-black p-4">
            <div className="flex flex-row gap-4 items-center w-full max-w-md justify-center">
                <Link to={`/profile/${post.userId}`} className="font-bold">
                    {post.displayName}
                </Link>
                <p>⚆ {timeAgo(post.createdAt)}</p>
                {!post.isOwnPost && (
                    <Form method="post">
                        <input type="hidden" name="intent" value={post.isFollowing ? "unfollow" : "follow"} />
                        <input type="hidden" name="targetUserId" value={post.userId} />
                        <button type="submit" className={post.isFollowing ? "text-neutral-400" : "text-blue-400"}>
                            {post.isFollowing ? "Following" : "Follow"}
                        </button>
                    </Form>
                )}
                {post.isOwnPost && (
                    <Form method="post">
                        <input type="hidden" name="intent" value="deletePost" />
                        <input type="hidden" name="postId" value={post.id} />
                        <button type="submit" className="text-red-400">
                            Delete
                        </button>
                    </Form>
                )}
            </div>

            <img
                className="w-72 h-72 m-2 border-2 border-black object-cover"
                src={post.imageData}
                alt={post.caption ?? "Workout post"}
            />

            <div className="flex flex-row gap-4">
                <Form method="post">
                    <input type="hidden" name="intent" value="like" />
                    <input type="hidden" name="postId" value={post.id} />
                    <button type="submit">
                        {post.likedByMe ? "🔥" : "🤍"} {post.likeCount}
                    </button>
                </Form>
                <p>🗨️ {post.commentCount}</p>
                <Form method="post">
                    <input type="hidden" name="intent" value="repost" />
                    <input type="hidden" name="postId" value={post.id} />
                    <button type="submit">🔗 {post.repostCount}</button>
                </Form>
            </div>

            {isEditingCaption ? (
                <Form
                    method="post"
                    className="flex gap-2 w-full max-w-md"
                    onSubmit={() => setIsEditingCaption(false)}
                >
                    <input type="hidden" name="intent" value="editPost" />
                    <input type="hidden" name="postId" value={post.id} />
                    <input
                        name="caption"
                        defaultValue={post.caption ?? ""}
                        className="flex-1 border-b bg-transparent text-neutral-200"
                        autoFocus
                    />
                    <button type="submit">Save</button>
                    <button type="button" onClick={() => setIsEditingCaption(false)}>
                        Cancel
                    </button>
                </Form>
            ) : (
                (post.caption || post.isOwnPost) && (
                    <div className="flex flex-row gap-2 w-full max-w-md items-center">
                        <Link to={`/profile/${post.userId}`} className="font-bold hover:underline">
                            {post.displayName}
                        </Link>
                        <p>{post.caption}</p>
                        {post.isOwnPost && (
                            <button onClick={() => setIsEditingCaption(true)} className="text-sm text-neutral-400">
                                Edit
                            </button>
                        )}
                    </div>
                )
            )}

            {post.comments.length > 0 && (
                <CommentThread
                    postId={post.id}
                    comments={post.comments}
                    isOwnPost={post.isOwnPost}
                    currentUserId={currentUserId}
                />
            )}

            <Form method="post" className="flex gap-2 w-full max-w-md">
                <input type="hidden" name="intent" value="comment" />
                <input type="hidden" name="postId" value={post.id} />
                <input
                    key={`comment-input-${post.id}-${post.comments.length}`}
                    name="text"
                    placeholder="Add a comment..."
                    className="flex-1 border-b bg-transparent text-neutral-200"
                />
                <button type="submit">Post</button>
            </Form>
        </div>
    );
}