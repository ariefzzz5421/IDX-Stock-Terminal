import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser, isGuest, requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { Panel } from "@/components/terminal/Panel";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { SignOutButton } from "@/components/profile/SignOutButton";

export const metadata: Metadata = { title: "Akun — IDX Terminal" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await requireUser();
  const signedIn = await getCurrentUser();
  const guest = isGuest(user);

  const following = await prisma.watchlist.count({ where: { userId: user.id } });

  return (
    <div className="grid min-h-0 flex-1 gap-px xl:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
      <Panel title="Akun" meta={user.username} bodyClassName="overflow-auto p-5">
        <ProfileForm
          username={user.username}
          memberSince={user.createdAt.toISOString().slice(0, 10)}
          displayName={user.profile?.displayName ?? ""}
          bio={user.profile?.bio ?? ""}
          avatarUrl={user.profile?.avatarUrl ?? null}
        />
      </Panel>

      <Panel title="Sesi" bodyClassName="overflow-auto p-5">
        <dl className="mb-5 flex flex-col gap-3">
          <Stat label="Masuk sebagai" value={signedIn ? user.username : "Tamu"} />
          <Stat label="Pantauan" value={`${following} saham`} />
          <Stat
            label="Mode"
            value={guest ? "Akun bersama" : "Akun pribadi"}
          />
        </dl>

        {guest ? (
          <div className="border border-amber-dim bg-amber/5 px-3 py-3">
            <p className="mb-3 text-xs leading-relaxed text-dim">
              Anda memakai akun tamu bersama. Daftar pantauan dan profil ini dapat
              dilihat siapa saja yang membuka terminal. Buat akun untuk menyimpan milik sendiri.
            </p>
            <div className="flex gap-2">
              <Link
                href="/register"
                className="bg-amber px-3 py-1.5 text-micro font-bold uppercase tracking-[0.12em] text-void transition-colors hover:bg-ink-hi"
              >
                Buat akun
              </Link>
              <Link
                href="/login"
                className="border border-rule-hi px-3 py-1.5 text-micro uppercase tracking-[0.12em] text-dim transition-colors hover:border-amber hover:text-amber"
              >
                Masuk
              </Link>
            </div>
          </div>
        ) : (
          <div><p className="text-xs leading-relaxed text-dim">Daftar pantauan dan profil hanya milik akun ini.</p><SignOutButton /></div>
        )}
      </Panel>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-micro uppercase tracking-[0.12em] text-dim">{label}</dt>
      <dd className="text-sm text-ink-hi">{value}</dd>
    </div>
  );
}
