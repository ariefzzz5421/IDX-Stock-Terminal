import Link from "next/link";
import { Suspense } from "react";
import { isGuest, requireUser } from "@/lib/auth/session";
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
import { COMPANY_CATALOG } from "@/lib/company-catalog";
import { getUiLanguage } from "@/lib/ui-language";
import { FooterClock } from "@/components/terminal/FooterClock";
import { BiRateFooter } from "@/components/terminal/BiRateFooter";
import { MobileExtensionDock } from "@/components/terminal/MobileExtensionDock";

const codes = COMPANY_CATALOG.map((stock) => stock.code).sort();
const searchStocks = COMPANY_CATALOG.map(({ code, name }) => ({ code, name }));

async function IhsgHeader() {
  return <IhsgQuoteBadge initial={await getIhsgQuote()} />;
}

export default async function DashboardLayout({ children }: LayoutProps<"/">) {
  const missing = missingSettings();
  if (missing.length > 0) return <SetupRequired missing={missing} />;

  const user = await requireUser();
  const language = await getUiLanguage();
  await ensureStockCatalog();

  return (
    <div className="flex min-h-full flex-1 flex-col gap-px bg-rule">
      {/* ---- top bar ---- */}
      <header className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-px bg-rule sm:grid-cols-[auto_minmax(0,1fr)_auto] xl:grid-cols-[auto_minmax(10rem,1fr)_minmax(13rem,auto)_auto_auto]">
        <div className="col-start-1 row-start-1 flex min-w-0 items-stretch bg-panel">
        <Nav headerTrigger />
        <Link
          href="/dashboard"
          className="flex min-w-0 items-baseline gap-2 bg-panel px-2 py-2.5 hover:opacity-80 sm:px-4"
        >
          <span className="font-display text-lg font-bold tracking-[0.16em] text-amber">
            IDX
          </span>
          <span className="text-micro font-semibold uppercase tracking-[0.2em] text-ink">
            Terminal
          </span>
        </Link>
        </div>

        <div className="col-span-2 row-start-2 flex min-w-0 bg-panel sm:col-span-1 sm:col-start-2 sm:row-start-1 xl:col-start-2">
          <CommandBar stocks={searchStocks} />
        </div>

        <div className="col-span-2 row-start-3 flex min-w-0 items-center bg-panel sm:col-span-1 sm:col-start-1 sm:row-start-2 xl:col-start-3 xl:row-start-1">
          <Suspense fallback={<IhsgQuoteBadge initial={null} />}><IhsgHeader /></Suspense>
        </div>

        <div className="col-span-2 row-start-4 flex min-w-0 items-center bg-panel sm:col-start-2 sm:row-start-2 xl:col-span-1 xl:col-start-4 xl:row-start-1">
          <MarketStatusBadge />
        </div>

        <div className="col-start-2 row-start-1 flex bg-panel sm:col-start-3 xl:col-start-5">
          <UserBadge
            username={user.username}
            displayName={user.profile?.displayName ?? null}
            avatarUrl={user.profile?.avatarUrl ?? null}
            guest={isGuest(user)}
          />
        </div>
      </header>

      <Nav desktopOnly />

      <Suspense fallback={null}><TrendingDock /></Suspense>
      <Suspense fallback={null}><MobileExtensionDock userId={user.id} /></Suspense>

      {/* ---- panes ---- */}
      <div className="flex min-h-0 flex-1 flex-col gap-px">{children}</div>

      {/* ---- status bar ---- */}
      <footer className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 bg-panel-hi px-4 py-2 text-micro uppercase tracking-[0.1em] text-dim">
        <span>
          {language === "id" ? "Emiten" : "Listings"} <span className="text-ink">{codes.length}</span>
        </span>
        <Suspense fallback={<span className="text-dim">BI-Rate …</span>}><BiRateFooter /></Suspense>
        <FooterClock />
      </footer>
    </div>
  );
}
