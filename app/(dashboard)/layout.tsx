import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/db/prisma";
import { isGuest, requireUser } from "@/lib/auth/session";
import { marketData } from "@/lib/market-data";
import { CommandBar } from "@/components/terminal/CommandBar";
import { UserBadge } from "@/components/terminal/UserBadge";
import { MarketStatusBadge } from "@/components/terminal/MarketStatusBadge";
import { Nav } from "@/components/terminal/Nav";
import { ensureStockCatalog } from "@/lib/stocks";
import { missingSettings } from "@/lib/config";
import { SetupRequired } from "@/components/SetupRequired";
import { TrendingDock } from "@/components/terminal/TrendingDock";
import { IhsgQuoteBadge } from "@/components/terminal/IhsgQuoteBadge";
import { getIhsgQuote } from "@/lib/market-data/ihsg";

export default async function DashboardLayout({ children }: LayoutProps<"/">) {
  const missing = missingSettings();
  if (missing.length > 0) return <SetupRequired missing={missing} />;

  const user = await requireUser();
  await ensureStockCatalog();

  const [stocks, ihsg] = await Promise.all([prisma.stock.findMany({
    where: { isListed: true },
    select: { code: true },
    orderBy: { code: "asc" },
  }), getIhsgQuote()]);
  const codes = stocks.map((s) => s.code);

  return (
    <div className="flex min-h-full flex-1 flex-col gap-px bg-rule">
      {/* ---- top bar ---- */}
      <header className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-px bg-rule lg:grid-cols-[auto_minmax(12rem,1fr)_auto_auto_auto]">
        <Link
          href="/dashboard"
          className="col-start-1 row-start-1 flex shrink-0 items-baseline gap-2.5 bg-panel px-4 py-2.5 hover:opacity-80"
        >
          <span className="font-display text-lg font-bold tracking-[0.16em] text-amber">
            IDX
          </span>
          <span className="text-micro uppercase tracking-[0.2em] text-dim">
            Terminal
          </span>
        </Link>

        <div className="col-span-2 row-start-2 flex min-w-0 bg-panel lg:col-span-1 lg:col-start-2 lg:row-start-1">
          <CommandBar knownCodes={codes} />
        </div>

        <div className="col-start-1 row-start-3 flex min-w-0 items-center bg-panel lg:col-start-3 lg:row-start-1">
          <IhsgQuoteBadge initial={ihsg} />
        </div>

        <div className="col-start-2 row-start-3 flex min-w-0 items-center bg-panel lg:col-start-4 lg:row-start-1">
          <MarketStatusBadge />
        </div>

        <div className="col-start-2 row-start-1 flex bg-panel lg:col-start-5">
          <UserBadge
            username={user.username}
            displayName={user.profile?.displayName ?? null}
            avatarUrl={user.profile?.avatarUrl ?? null}
            guest={isGuest(user)}
          />
        </div>
      </header>

      <Nav />

      <Suspense fallback={null}><TrendingDock /></Suspense>

      {/* ---- panes ---- */}
      <div className="flex min-h-0 flex-1 flex-col gap-px">{children}</div>

      {/* ---- status bar ---- */}
      <footer className="flex flex-wrap items-center gap-x-6 gap-y-1 bg-panel-hi px-4 py-2 text-micro uppercase tracking-[0.1em] text-dim">
        <span>
          Universe <span className="text-ink">{codes.length}</span>
        </span>
        <span>
          Provider <span className="text-ink">{marketData.name}</span>
        </span>
        <span>
          Feed <span className="text-ink">snapshot on load</span>
        </span>
        <span className="ml-auto text-dimmer">
          Delayed data · not investment advice
        </span>
      </footer>
    </div>
  );
}
