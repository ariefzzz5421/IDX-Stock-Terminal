import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser, isGuest, requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { Panel } from "@/components/terminal/Panel";
import { ProfileForm } from "@/components/profile/ProfileForm";

export const metadata: Metadata = { title: "Account — IDX Terminal" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await requireUser();
  const signedIn = await getCurrentUser();
  const guest = isGuest(user);

  const following = await prisma.watchlist.count({ where: { userId: user.id } });

  return (
    <div className="grid min-h-0 flex-1 gap-px xl:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
      <Panel title="Account" meta={user.username} bodyClassName="overflow-auto p-5">
        <ProfileForm
          username={user.username}
          memberSince={user.createdAt.toISOString().slice(0, 10)}
          displayName={user.profile?.displayName ?? ""}
          bio={user.profile?.bio ?? ""}
          avatarUrl={user.profile?.avatarUrl ?? null}
        />
      </Panel>

      <Panel title="Session" bodyClassName="overflow-auto p-5">
        <dl className="mb-5 flex flex-col gap-3">
          <Stat label="Signed in as" value={signedIn ? user.username : "Guest"} />
          <Stat label="Following" value={`${following} tickers`} />
          <Stat
            label="Mode"
            value={guest ? "Shared account" : "Personal account"}
          />
        </dl>

        {guest ? (
          <div className="border border-amber-dim bg-amber/5 px-3 py-3">
            <p className="mb-3 text-xs leading-relaxed text-dim">
              You&rsquo;re on the shared guest account — this watchlist and profile
              are visible to anyone who opens this terminal. Create an account to
              keep your own.
            </p>
            <div className="flex gap-2">
              <Link
                href="/register"
                className="bg-amber px-3 py-1.5 text-micro font-bold uppercase tracking-[0.12em] text-void transition-colors hover:bg-ink-hi"
              >
                Create account
              </Link>
              <Link
                href="/login"
                className="border border-rule-hi px-3 py-1.5 text-micro uppercase tracking-[0.12em] text-dim transition-colors hover:border-amber hover:text-amber"
              >
                Sign in
              </Link>
            </div>
          </div>
        ) : (
          <p className="text-xs leading-relaxed text-dim">
            Your watchlist and profile are private to this account. Use{" "}
            <span className="text-ink">Exit</span> in the header to sign out.
          </p>
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
