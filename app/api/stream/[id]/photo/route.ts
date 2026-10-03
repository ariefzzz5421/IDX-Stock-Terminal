import { prisma } from "@/lib/db/prisma";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await prisma.streamPost.findUnique({ where: { id }, select: { photoData: true } });
  if (!post?.photoData) return new Response(null, { status: 404 });
  const match = /^data:image\/(png|jpeg|webp);base64,(.+)$/.exec(post.photoData);
  if (!match) return new Response(null, { status: 404 });
  return new Response(Buffer.from(match[2], "base64"), { headers: { "Content-Type": `image/${match[1]}`, "Cache-Control": "public, max-age=3600, immutable", "X-Content-Type-Options": "nosniff" } });
}
