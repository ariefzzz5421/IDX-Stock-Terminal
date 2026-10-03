import "server-only";
import { prisma } from "@/lib/db/prisma";
import type { StreamPostView } from "@/lib/stream-types";

const PAGE_SIZE = 20;

export async function listStreamPosts(viewerId: string, options: { authorId?: string; cursor?: string } = {}) {
  const rows = await prisma.streamPost.findMany({
    where: options.authorId ? { authorId: options.authorId } : undefined,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: PAGE_SIZE + 1,
    ...(options.cursor ? { skip: 1, cursor: { id: options.cursor } } : {}),
    select: {
      id: true, kind: true, body: true, tickers: true, hasPhoto: true, createdAt: true,
      author: { select: { username: true, profile: { select: { displayName: true, avatarUrl: true } } } },
      _count: { select: { likes: true, comments: true } },
      likes: { where: { userId: viewerId }, select: { userId: true }, take: 1 },
      comments: { orderBy: { createdAt: "desc" }, take: 2, select: {
        id: true, body: true, createdAt: true,
        author: { select: { username: true, profile: { select: { displayName: true, avatarUrl: true } } } },
      } },
    },
  });
  const hasMore = rows.length > PAGE_SIZE;
  const page = rows.slice(0, PAGE_SIZE);
  return { posts: page.map(toView), nextCursor: hasMore ? page.at(-1)?.id ?? null : null };
}

export async function getStreamPost(id: string, viewerId: string) {
  const row = await prisma.streamPost.findUnique({
    where: { id },
    select: {
      id: true, kind: true, body: true, tickers: true, hasPhoto: true, createdAt: true,
      author: { select: { username: true, profile: { select: { displayName: true, avatarUrl: true } } } },
      _count: { select: { likes: true, comments: true } },
      likes: { where: { userId: viewerId }, select: { userId: true }, take: 1 },
      comments: { orderBy: { createdAt: "desc" }, take: 50, select: {
        id: true, body: true, createdAt: true,
        author: { select: { username: true, profile: { select: { displayName: true, avatarUrl: true } } } },
      } },
    },
  });
  return row ? toView(row) : null;
}

type PersonRow = { username: string; profile: { displayName: string | null; avatarUrl: string | null } | null };
type Row = {
  id: string; kind: string; body: string; tickers: string; hasPhoto: boolean; createdAt: Date;
  author: PersonRow;
  _count: { likes: number; comments: number };
  likes: Array<{ userId: string }>;
  comments: Array<{ id: string; body: string; createdAt: Date; author: PersonRow }>;
};

function toView(row: Row): StreamPostView {
  let tickers: string[] = [];
  try { const parsed: unknown = JSON.parse(row.tickers); if (Array.isArray(parsed)) tickers = parsed.filter((code): code is string => typeof code === "string"); } catch { /* old invalid row */ }
  return {
    id: row.id, kind: row.kind === "thesis" ? "thesis" : "status", body: row.body,
    tickers, hasPhoto: row.hasPhoto, createdAt: row.createdAt.toISOString(),
    author: { username: row.author.username, displayName: row.author.profile?.displayName ?? null, avatarUrl: row.author.profile?.avatarUrl ?? null },
    likes: row._count.likes, liked: row.likes.length > 0, comments: row._count.comments,
    recentComments: row.comments.map((comment) => ({
      id: comment.id, body: comment.body, createdAt: comment.createdAt.toISOString(),
      author: { username: comment.author.username, displayName: comment.author.profile?.displayName ?? null, avatarUrl: comment.author.profile?.avatarUrl ?? null },
    })),
  };
}
