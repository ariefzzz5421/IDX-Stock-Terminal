import type { Metadata } from "next";
import { isGuest, requireUser } from "@/lib/auth/session";
import { ProfileForm } from "@/components/profile/ProfileForm";

export const metadata: Metadata = { title: "Profil — IDX Terminal" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await requireUser();
  return <main className="min-w-0 flex-1 bg-void">
    <ProfileForm
      username={user.username}
      memberSince={user.createdAt.toISOString().slice(0, 10)}
      displayName={user.profile?.displayName ?? ""}
      bio={user.profile?.bio ?? ""}
      avatarUrl={user.profile?.avatarUrl ?? null}
      guest={isGuest(user)}
    />
  </main>;
}
