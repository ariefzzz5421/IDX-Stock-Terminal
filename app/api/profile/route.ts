import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getViewer } from "@/lib/auth/session";

const MAX_DISPLAY_NAME = 40;
const MAX_BIO = 280;
/** Avatars are stored as data URIs in Postgres — simple, and no blob store. */
const MAX_AVATAR_BYTES = 512 * 1024;

export async function PUT(request: Request) {
  const user = await getViewer();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  let body: { displayName?: string; bio?: string; avatarUrl?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  const displayName = (body.displayName ?? "").trim();
  const bio = (body.bio ?? "").trim();
  const avatarUrl = body.avatarUrl ?? null;

  if (displayName.length > MAX_DISPLAY_NAME) {
    return NextResponse.json(
      { error: `Display name must be at most ${MAX_DISPLAY_NAME} characters.` },
      { status: 400 },
    );
  }

  if (bio.length > MAX_BIO) {
    return NextResponse.json(
      { error: `Bio must be at most ${MAX_BIO} characters.` },
      { status: 400 },
    );
  }

  if (avatarUrl !== null) {
    if (!avatarUrl.startsWith("data:image/")) {
      return NextResponse.json(
        { error: "Avatar must be an image." },
        { status: 400 },
      );
    }
    if (avatarUrl.length > MAX_AVATAR_BYTES) {
      return NextResponse.json(
        { error: "That image is too large. Pick one under 350 KB." },
        { status: 413 },
      );
    }
  }

  const data = {
    displayName: displayName || null,
    bio: bio || null,
    avatarUrl,
  };

  await prisma.profile.upsert({
    where: { userId: user.id },
    update: data,
    create: { userId: user.id, ...data },
  });

  return NextResponse.json({ ok: true });
}
