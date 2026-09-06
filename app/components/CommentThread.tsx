import {useState} from "react";
import {Form} from "react-router";
import {Link} from "react-router";

export interface CommentData {
    id: string;
    userId: string;
    displayName: string;
    text: string;
    createdAt: Date;
    likeCount: number;
    likedByMe: boolean;
    parentCommentId: string | null;
    edited: boolean;
    editedAt: Date | null;
}

type Props = {
    postId: string;
    comments: CommentData[];
    isOwnPost: boolean;
    currentUserId: string;
};

export function CommentThread({postId, comments, isOwnPost, currentUserId}: Props) {
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);

    const topLevel = comments.filter((c) => c.parentCommentId === null);
    const repliesFor = (commentId: string) =>
        comments.filter((c) => c.parentCommentId === commentId);

    function renderComment(comment: CommentData, isReply: boolean) {
        const canDelete = isOwnPost || comment.userId === currentUserId;
        const canEdit = comment.userId === currentUserId;
        const isEditing = editingCommentId === comment.id;

        return (
            <div key={comment.id} className={isReply ? "ml-6 mt-1" : "mt-1"}>
                {isEditing ? (
                    <Form
                        method="post"
                        className="flex gap-2"
                        onSubmit={() => setEditingCommentId(null)}
                    >
                        <input type="hidden" name="intent" value="editComment" />
                        <input type="hidden" name="postId" value={postId} />
                        <input type="hidden" name="commentId" value={comment.id} />
                        <input
                            name="text"
                            defaultValue={comment.text}
                            className="flex-1 border-b bg-transparent text-neutral-200 text-sm"
                            autoFocus
                        />
                        <button type="submit">Save</button>
                        <button type="button" onClick={() => setEditingCommentId(null)}>
                            Cancel
                        </button>
                    </Form>
                ) : (
                    <div className="flex gap-2 items-center">
                        <Link to={`/profile/${comment.userId}`} className="font-bold hover:underline">
                            {comment.displayName}
                        </Link>
                        <p>{comment.text}</p>
                        {comment.edited && (
                            <span className="text-xs text-neutral-500">(edited)</span>
                        )}
                    </div>
                )}

                <div className="flex gap-3 text-sm text-neutral-400">
                    <Form method="post">
                        <input type="hidden" name="intent" value="likeComment" />
                        <input type="hidden" name="postId" value={postId} />
                        <input type="hidden" name="commentId" value={comment.id} />
                        <button type="submit">
                            {comment.likedByMe ? "🔥" : "🤍"} {comment.likeCount}
                        </button>
                    </Form>
                    <button onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}>
                        Reply
                    </button>
                    {canEdit && !isEditing && (
                        <button onClick={() => setEditingCommentId(comment.id)}>Edit</button>
                    )}
                    {canDelete && (
                        <Form method="post">
                            <input type="hidden" name="intent" value="deleteComment" />
                            <input type="hidden" name="postId" value={postId} />
                            <input type="hidden" name="commentId" value={comment.id} />
                            <button type="submit" className="text-red-400">
                                Delete
                            </button>
                        </Form>
                    )}
                </div>

                {replyingTo === comment.id && (
                    <Form method="post" className="flex gap-2 mt-1">
                        <input type="hidden" name="intent" value="comment" />
                        <input type="hidden" name="postId" value={postId} />
                        <input type="hidden" name="parentCommentId" value={comment.id} />
                        <input
                            key={`reply-input-${comment.id}-${repliesFor(comment.id).length}`}
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