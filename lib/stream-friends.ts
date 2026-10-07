import "server-only";
import { prisma } from "@/lib/db/prisma";
import { GUEST_USERNAME } from "@/lib/auth/guest";

export type FriendshipState = "none" | "outgoing" | "incoming" | "friends";

export function friendPair(a: string, b: string) {
  return a < b ? { userAId: a, userBId: b } : { userAId: b, userBId: a };
}

export async function listFriends(viewerId: string, search = "", cursor?: string, acceptedOnly = false) {
  const users = await prisma.user.findMany({
    where: {
      id: { not: viewerId }, username: { not: GUEST_USERNAME },
      AND: [
        ...(search ? [{ OR: [{ username: { contains: search } }, { profile: { is: { displayName: { contains: search } } } }] }] : []),
        ...(acceptedOnly ? [{ OR: [
        { friendAsA: { some: { userBId: viewerId, status: "ACCEPTED" } } },
        { friendAsB: { some: { userAId: viewerId, status: "ACCEPTED" } } },
        ] }] : []),
      ],
    },
    orderBy: [{ username: "asc" }, { id: "asc" }],
    take: 21,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    select: { id: true, username: true, profile: { select: { displayName: true, avatarUrl: true } } },
  });
  const page = users.slice(0, 20);
  const friendships = page.length ? await prisma.streamFriendship.findMany({
    where: { OR: [
      { userAId: viewerId, userBId: { in: page.map((user) => user.id) } },
      { userBId: viewerId, userAId: { in: page.map((user) => user.id) } },
    ] },
    select: { userAId: true, userBId: true, requestedById: true, status: true },
  }) : [];
  return {
    users: page.map((user) => {
      const edge = friendships.find((item) => item.userAId === user.id || item.userBId === user.id);
      const state: FriendshipState = !edge ? "none" : edge.status === "ACCEPTED" ? "friends" : edge.requestedById === viewerId ? "outgoing" : "incoming";
      return { username: user.username, displayName: user.profile?.displayName ?? null, avatarUrl: user.profile?.avatarUrl ?? null, state };
    }),
    nextCursor: users.length > 20 ? page.at(-1)?.id ?? null : null,
  };
}

export async function verifyFriendMentions(body: string, authorId: string) {
  const names = [...new Set(Array.from(body.matchAll(/(^|[^\w])@([A-Za-z0-9_]{3,30})\b/g), (match) => match[2]))];
  if (!names.length) return true;
  if (names.length > 10) return false;
  const users = await prisma.user.findMany({ where: { username: { in: names } }, select: { id: true } });
  if (users.length !== names.length) return false;
  const friends = await prisma.streamFriendship.count({ where: {
    status: "ACCEPTED",
    OR: [
      { userAId: authorId, userBId: { in: users.map((user) => user.id) } },
      { userBId: authorId, userAId: { in: users.map((user) => user.id) } },
    ],
  } });
  return friends === names.length;
}
