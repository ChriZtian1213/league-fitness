import {useState, useRef, useEffect} from "react";
import {Form, Link} from "react-router";
import {CommentThread} from "~/components/CommentThread";
import type {getFeed} from "~/server/post.server";
import {timeAgo} from "~/utils/timeAgo";

type FeedPost = Awaited<ReturnType<typeof getFeed>>[number];

export function PostCard({post, currentUserId}: {post: FeedPost; currentUserId: string}) {
    const [isEditingCaption, setIsEditingCaption] = useState(false);
    const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
    const [activeEditId, setActiveEditId] = useState<string | null>(null);
    const [wantsFocus, setWantsFocus] = useState(false);
    const [commentFlash, setCommentFlash] = useState(false);
    const [repostFlash, setRepostFlash] = useState(false);

    function handleCommentClick() {
        setCommentFlash(true);
        setTimeout(() => setCommentFlash(false), 300);
        focusCommentInput();
    }

    function handleRepostClick() {
        setRepostFlash(true);
        setTimeout(() => setRepostFlash(false), 300);
    }

    const commentInputRef = useRef<HTMLInputElement>(null);

    function focusCommentInput() {
        setActiveReplyId(null);
        setActiveEditId(null);
        setWantsFocus(true);
    }

    useEffect(() => {
        if (wantsFocus && !activeReplyId && !activeEditId) {
            commentInputRef.current?.focus();
            commentInputRef.current?.scrollIntoView({behavior: "smooth", block: "center"});
            setWantsFocus(false);
        }
    }, [wantsFocus, activeReplyId, activeEditId]);

    return (
        <div className="flex flex-col items-center gap-3 border-t-2 border-black p-4">
            <div className="flex flex-row gap-2 items-center w-full max-w-md justify-center">
                <Link to={`/profile/${post.userId}`}>
                    <img
                        src={post.profilePicture || "/favicon.ico"}
                        alt={`${post.displayName}'s profile picture`}
                        className="w-8 h-8 rounded-full object-cover border border-black"
                    />
                </Link>
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
                className="w-full max-w-md border-2 border-black object-contain"
                src={post.imageData}
                alt={post.caption ?? "Workout post"}
            />

            <div className="flex flex-row gap-3">
                <Form method="post">
                    <input type="hidden" name="intent" value="like" />
                    <input type="hidden" name="postId" value={post.id} />
                    <button
                        type="submit"
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full border text-sm font-bold transition-colors
                ${post.likedByMe
                            ? "bg-red-500/20 border-red-500 text-red-400"
                            : "border-neutral-500 text-neutral-300 hover:border-neutral-400"
                        }`}
                    >
                        {post.likedByMe ? "🔥" : "🤍"} {post.likeCount}
                    </button>
                </Form>

                <button
                    type="button"
                    onClick={handleCommentClick}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full border text-sm font-bold transition-colors
            ${commentFlash
                        ? "bg-white/30 border-white text-white"
                        : "border-neutral-500 text-neutral-300"
                    }`}
                >
                    🗨️ {post.commentCount}
                </button>

                <Form method="post">
                    <input type="hidden" name="intent" value="repost" />
                    <input type="hidden" name="postId" value={post.id} />
                    <button
                        type="submit"
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full border text-sm font-bold transition-colors
                ${post.isRepostedByMe
                            ? "bg-blue-500/20 border-blue-500 text-blue-400"
                            : "border-neutral-500 text-neutral-300 hover:border-neutral-400"
                        }`}
                    >
                        🔗 {post.repostCount}
                    </button>
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
                    activeReplyId={activeReplyId}
                    onReplyingChange={setActiveReplyId}
                    activeEditId={activeEditId}
                    onEditingChange={setActiveEditId}
                />
            )}

            {!activeReplyId && !activeEditId && (
                <Form method="post" className="flex gap-2 w-full max-w-md">
                    <input type="hidden" name="intent" value="comment" />
                    <input type="hidden" name="postId" value={post.id} />
                    <input
                        ref={commentInputRef}
                        key={`comment-input-${post.id}-${post.comments.length}`}
                        name="text"
                        placeholder="Add a comment..."
                        className="flex-1 border rounded-md px-3 py-2 bg-transparent text-neutral-200"
                        autoComplete="off"
                    />
                    <button type="submit" className="border rounded-md px-4 py-2 font-bold bg-green-700">
                        Post
                    </button>
                </Form>
            )}
        </div>
    );
}