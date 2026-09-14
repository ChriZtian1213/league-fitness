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
    activeReplyId?: string | null;
    activeEditId?: string | null;
    onReplyingChange?: (replyingTo: string | null) => void;
    onEditingChange?: (editingId: string | null) => void;
};

export function CommentThread({postId, comments, isOwnPost, currentUserId, onReplyingChange, activeReplyId, onEditingChange, activeEditId}: Props) {
    const [internalReplyingTo, setInternalReplyingTo] = useState<string | null>(null);
    const [internalEditingId, setInternalEditingId] = useState<string | null>(null);
    const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());

    function toggleCommentExpanded(commentId: string) {
        setExpandedComments((prev) => {
            const next = new Set(prev);
            if (next.has(commentId)) next.delete(commentId);
            else next.add(commentId);
            return next;
        });
    }

    const isReplyControlled = activeReplyId !== undefined;
    const replyingTo = isReplyControlled ? activeReplyId : internalReplyingTo;

    const isEditControlled = activeEditId !== undefined;
    const editingCommentId = isEditControlled ? activeEditId : internalEditingId;

    function setReplyingTo(id: string | null) {
        if (!isReplyControlled) setInternalReplyingTo(id);
        onReplyingChange?.(id);
    }

    function setEditingCommentId(id: string | null) {
        if (!isEditControlled) setInternalEditingId(id);
        onEditingChange?.(id);
    }

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
                        <textarea
                            name="text"
                            defaultValue={comment.text}
                            rows={1}
                            className="flex-1 border rounded-md px-3 py-2 bg-transparent text-neutral-200 text-sm resize-none"
                            autoFocus
                            autoComplete="off"
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    e.currentTarget.form?.requestSubmit();
                                }
                            }}
                        />
                        <button type="submit" className="border rounded-md px-4 py-2 font-bold bg-green-700 text-sm">Save</button>
                        <button type="button" onClick={() => setEditingCommentId(null)} className="border rounded-md px-4 py-2 text-sm">
                            Cancel
                        </button>
                    </Form>
                ) : (
                    <div>
                        <p className={`leading-snug whitespace-pre-wrap break-words ${
                            !expandedComments.has(comment.id) ? (isReply ? "line-clamp-2" : "line-clamp-3") : ""
                        }`}>
                            <Link to={`/profile/${comment.userId}`} className="font-bold hover:underline mr-1">
                                {comment.displayName}
                            </Link>
                            {comment.text}
                            {comment.edited && (
                                <span className="text-xs text-neutral-500 ml-1">(edited)</span>
                            )}
                        </p>
                        {(comment.text.length > 80 || comment.text.split("\n").length > (isReply ? 2 : 3)) && (
                            <button
                                onClick={() => toggleCommentExpanded(comment.id)}
                                className="text-xs text-blue-400 mt-0.5"
                            >
                                {expandedComments.has(comment.id) ? "Show less" : "View all"}
                            </button>
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
                    {!isEditing && (
                        <button onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}>
                            {replyingTo === comment.id ? "Cancel" : "Reply"}
                        </button>
                    )}
                    {canEdit && !isEditing && (
                        <button onClick={() => setEditingCommentId(comment.id)}>Edit</button>
                    )}
                    {canDelete && (
                        <Form
                            method="post"
                            onSubmit={(e) => {
                                const button = e.currentTarget.querySelector('button[type="submit"]') as HTMLButtonElement | null;
                                if (button) button.disabled = true;
                            }}
                        >
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
                    <Form
                        method="post"
                        className="flex gap-2 mt-1 ml-6"
                        key={`reply-input-${comment.id}-${repliesFor(comment.id).length}`}
                        onSubmit={(e) => {
                            const button = e.currentTarget.querySelector('button[type="submit"]') as HTMLButtonElement | null;
                            if (button) button.disabled = true;
                        }}
                    >
                        <input type="hidden" name="intent" value="comment" />
                        <input type="hidden" name="postId" value={postId} />
                        <input type="hidden" name="parentCommentId" value={comment.id} />
                        <textarea
                            name="text"
                            placeholder={`Reply to ${comment.displayName}...`}
                            rows={1}
                            className="flex-1 border rounded-md px-3 py-2 bg-transparent text-neutral-200 text-sm resize-none"
                            autoFocus
                            autoComplete="off"
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    e.currentTarget.form?.requestSubmit();
                                }
                            }}
                        />
                        <button type="submit" className="border rounded-md px-4 py-2 font-bold bg-green-700 text-sm">
                            Post
                        </button>
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