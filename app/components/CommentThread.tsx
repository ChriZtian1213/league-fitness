import {useState} from "react";
import { Form } from "react-router";
import type {PostEntry} from "~/types/post";

export default function CommentThread({post}: {post: PostEntry}) {
    const [replyingTo, setReplyingTo] = useState<string | null>(null);

    const topLevel = post.comments.filter((c) => c.parentCommentId === null);
    const repliesFor = (commentId: string) =>
        post.comments.filter((c) => c.parentCommentId === commentId);

    function renderComment(comment: PostEntry["comments"][number], isReply: boolean) {
        return (
            <div key={comment.id} className={isReply ? "ml-6 mt-1" : "mt-1"}>
                <div className="flex gap-2 items-center">
                    <p className="font-bold">{comment.displayName}</p>
                    <p>{comment.text}</p>
                </div>
                <div className="flex gap-3 text-sm text-neutral-400">
                    <Form method="post">
                        <input type="hidden" name="intent" value="likeComment" />
                        <input type="hidden" name="postId" value={post.id} />
                        <input type="hidden" name="commentId" value={comment.id} />
                        <button type="submit">
                            {comment.likedByMe ? "🔥" : "🤍"} {comment.likeCount}
                        </button>
                    </Form>
                    <button onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}>
                        Reply
                    </button>
                </div>

                {replyingTo === comment.id && (
                    <Form method="post" className="flex gap-2 mt-1">
                        <input type="hidden" name="intent" value="comment" />
                        <input type="hidden" name="postId" value={post.id} />
                        <input type="hidden" name="parentCommentId" value={comment.id} />
                        <input
                            name="text"
                            placeholder={`Reply to ${comment.displayName}...`}
                            className="flex-1 border-b bg-transparent text-neutral-200 text-sm"
                            autoFocus
                        />
                        <button type="submit">Post</button>
                    </Form>
                )}

                {repliesFor(comment.id).map((reply) => renderComment(reply, true))}
            </div>
        );
    }

    return (
        <div className="w-full max-w-md flex flex-col gap-1">
            {topLevel.map((c) => renderComment(c, false))}
        </div>
    );
}