import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Login required" }, { status: 401 });
  if (request.headers.get("origin") !== new URL(request.url).origin) return Response.json({ error: "Invalid origin" }, { status: 403 });
  const result = await prisma.researchNotification.updateMany({ where: { userId: user.id, readAt: null }, data: { readAt: new Date() } });
  return Response.json({ marked: result.count }, { headers: { "Cache-Control": "no-store" } });
}
