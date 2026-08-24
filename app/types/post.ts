export interface Comment {
    id: string;
    userId: string;
    displayName: string;
    text: string;
    createdAt: Date;
    likeCount: number;
    likedByMe: boolean;
    parentCommentId: string | null;
}

export interface PostEntry {
    id: string;
    userId: string;
    displayName: string;
    imageData: string;
    caption?: string;
    createdAt: Date;
    likeCount: number;
    likedByMe: boolean;
    commentCount: number;
    comments: Comment[];
    repostCount: number;
    isFollowing: boolean;
    isOwnPost: boolean;
}