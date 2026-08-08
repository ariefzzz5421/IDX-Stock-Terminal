import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { isGuest, requireUser } from "@/lib/auth/session";
import { marketData } from "@/lib/market-data";
import { CommandBar } from "@/components/terminal/CommandBar";
import { UserBadge } from "@/components/terminal/UserBadge";
import { MarketClock } from "@/components/terminal/MarketClock";

export default async function DashboardLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();

  const stocks = await prisma.stock.findMany({
    select: { code: true },
    orderBy: { code: "asc" },
  });
  const codes = stocks.map((s) => s.code);

  return (
    <div className="flex min-h-full flex-1 flex-col gap-px bg-rule">
      {/* ---- top bar ---- */}
      <header className="flex flex-wrap items-stretch gap-px bg-rule">
        <Link
          href="/dashboard"
          className="flex items-baseline gap-2 bg-panel px-3.5 py-2 hover:opacity-80"
        >
          <span className="font-display text-base font-bold tracking-[0.16em] text-amber">
            IDX
          </span>
          <span className="text-[9.5px] uppercase tracking-[0.2em] text-dim">
            Terminal
          </span>
        </Link>

        <div className="flex min-w-0 flex-1 bg-panel">
          <CommandBar knownCodes={codes} />
        </div>

        <div className="flex bg-panel">
          <UserBadge
            username={user.username}
            displayName={user.profile?.displayName ?? null}
            avatarUrl={user.profile?.avatarUrl ?? null}
            guest={isGuest(user)}
          />
        </div>
      </header>

      {/* ---- panes ---- */}
      <div className="flex min-h-0 flex-1 flex-col gap-px">{children}</div>

      {/* ---- status bar ---- */}
      <footer className="flex flex-wrap items-center gap-x-5 gap-y-1 bg-panel-hi px-3.5 py-1.5 text-[9.5px] uppercase tracking-[0.09em] text-dim">
        <span>
          Universe <span className="text-ink">{codes.length}</span>
        </span>
        <span>
          Provider <span className="text-ink">{marketData.name}</span>
        </span>
        <span>
          Feed <span className="text-ink">snapshot on load</span>
        </span>
        <MarketClock />
      </footer>
    </div>
  );
}
