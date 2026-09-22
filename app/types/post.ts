import type { getFeed } from "~/server/post.server";

export type PostEntry = Awaited<ReturnType<typeof getFeed>>[number];