import { getCurrentUser } from "@/lib/auth/session";

export async function isResearchAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  const allowed = new Set((process.env.AI_ANALYST_ADMIN_USERNAMES ?? "").split(",").map((v) => v.trim().toLowerCase()).filter(Boolean));
  return allowed.has(user.username.toLowerCase());
}
