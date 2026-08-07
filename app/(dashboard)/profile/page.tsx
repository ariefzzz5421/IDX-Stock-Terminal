import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { Panel } from "@/components/terminal/Panel";

export const metadata: Metadata = { title: "Profile — IDX Terminal" };

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requireUser();

  return (
    <Panel title="Profile" meta={user.username} bodyClassName="overflow-auto p-4">
      <ProfileForm
        username={user.username}
        memberSince={user.createdAt.toISOString().slice(0, 10)}
        displayName={user.profile?.displayName ?? ""}
        bio={user.profile?.bio ?? ""}
        avatarUrl={user.profile?.avatarUrl ?? null}
      />
    </Panel>
  );
}
