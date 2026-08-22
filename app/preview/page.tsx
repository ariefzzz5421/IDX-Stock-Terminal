import type { Metadata } from "next";
import Link from "next/link";
import { Database, Eye, TerminalSquare } from "lucide-react";
import { MarketStatusBadge } from "@/components/terminal/MarketStatusBadge";
import { Panel } from "@/components/terminal/Panel";
import { StockTable, type StockRow } from "@/components/terminal/StockTable";

export const metadata: Metadata = { title: "Preview — IDX Terminal" };

const WATCHLIST: StockRow[] = [
  row("BBCA", "Bank Central Asia Tbk", "Financials", 9460, 1.18, 52_300_000, 497_000_000_000, 1_166_000_000_000_000),
  row("BBRI", "Bank Rakyat Indonesia (Persero) Tbk", "Financials", 4350, 0.69, 88_100_000, 383_000_000_000, 659_000_000_000_000),
  row("BMRI", "Bank Mandiri (Persero) Tbk", "Financials", 5260, -0.57, 61_900_000, 326_000_000_000, 491_000_000_000_000),
  row("TLKM", "Telkom Indonesia (Persero) Tbk", "Infrastructure", 3230, 1.57, 74_600_000, 241_000_000_000, 320_000_000_000_000),
  row("ASII", "Astra International Tbk", "Industrials", 5625, 0.45, 28_700_000, 161_000_000_000, 228_000_000_000_000),
];

const GAINERS: StockRow[] = [
  row("AMMN", "Amman Mineral Internasional Tbk", "Basic Materials", 7950, 5.30, 39_200_000, 312_000_000_000, 576_000_000_000_000),
  row("GOTO", "GoTo Gojek Tokopedia Tbk", "Technology", 67, 4.69, 1_950_000_000, 131_000_000_000, 80_000_000_000_000),
  row("ANTM", "Aneka Tambang Tbk", "Basic Materials", 2160, 3.35, 106_000_000, 228_000_000_000, 52_000_000_000_000),
  row("PGAS", "Perusahaan Gas Negara Tbk", "Infrastructure", 1715, 2.39, 44_000_000, 75_000_000_000, 42_000_000_000_000),
];

const LOSERS: StockRow[] = [
  row("UNVR", "Unilever Indonesia Tbk", "Consumer Non-Cyclicals", 1725, -3.36, 33_100_000, 57_000_000_000, 66_000_000_000_000),
  row("MDKA", "Merdeka Copper Gold Tbk", "Basic Materials", 2010, -2.43, 64_500_000, 130_000_000_000, 49_000_000_000_000),
  row("BRPT", "Barito Pacific Tbk", "Basic Materials", 915, -1.61, 90_800_000, 83_000_000_000, 86_000_000_000_000),
  row("INDF", "Indofood Sukses Makmur Tbk", "Consumer Non-Cyclicals", 7750, -1.27, 12_700_000, 98_000_000_000, 68_000_000_000_000),
];

const ACTIVE = [...WATCHLIST, ...GAINERS.slice(0, 3)].sort(
  (a, b) => (b.lastValue ?? 0) - (a.lastValue ?? 0),
);

function row(
  code: string,
  name: string,
  sector: string,
  lastPrice: number,
  lastChangePct: number,
  lastVolume: number,
  lastValue: number,
  marketCap: number,
): StockRow {
  return {
    code,
    name,
    sector,
    logoUrl: null,
    lastPrice,
    lastChangePct,
    lastVolume,
    lastValue,
    marketCap,
  };
}

const TABS = ["Dashboard", "Watchlist", "Top 10", "Foreign Flow", "Hot", "Market", "Account"];

export default function PreviewPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col gap-px bg-rule">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 bg-amber/10 px-4 py-2 text-xs text-amber">
        <span className="inline-flex items-center gap-2 font-bold uppercase tracking-[0.12em]">
          <Eye aria-hidden="true" className="h-3.5 w-3.5" />
          Preview mode
        </span>
        <span className="text-dim">
          Sample UI and demo numbers only — PostgreSQL and accounts are not connected yet.
        </span>
        <Link href="/" className="ml-auto text-ink underline-offset-4 hover:text-amber hover:underline">
          Back to landing
        </Link>
      </div>

      <header className="flex flex-wrap items-stretch gap-px bg-rule">
        <Link
          href="/"
          className="flex items-baseline gap-2.5 bg-panel px-4 py-2.5 hover:opacity-80"
        >
          <span className="font-display text-lg font-bold tracking-[0.16em] text-amber">IDX</span>
          <span className="text-micro uppercase tracking-[0.2em] text-dim">Terminal</span>
        </Link>

        <div className="flex min-w-[16rem] flex-1 items-center bg-panel px-4 text-xs text-dimmer">
          Search ticker or command… <span className="ml-auto text-micro uppercase tracking-[0.1em]">demo</span>
        </div>

        <div className="flex items-center bg-panel">
          <MarketStatusBadge />
        </div>

        <div className="flex items-center gap-2 bg-panel px-4 text-micro uppercase tracking-[0.1em] text-dim">
          <Database aria-hidden="true" className="h-3.5 w-3.5 text-amber" />
          DB offline
        </div>
      </header>

      <nav aria-label="Preview terminal sections" className="flex items-stretch gap-px overflow-x-auto bg-rule">
        {TABS.map((tab, index) => (
          <span
            key={tab}
            className={`whitespace-nowrap px-4 py-2 text-xs uppercase tracking-[0.12em] ${
              index === 0
                ? "bg-panel text-amber shadow-[inset_0_-2px_0_0_var(--color-amber)]"
                : "bg-panel-hi text-dim"
            }`}
          >
            {tab}
          </span>
        ))}
      </nav>

      <main className="grid min-h-0 flex-1 gap-px xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <Panel title="Watchlist" meta={`${WATCHLIST.length} demo issues`}>
          <StockTable rows={WATCHLIST} />
        </Panel>

        <div className="grid min-h-0 gap-px lg:grid-cols-2">
          <Panel title="Top gainers" meta="sample change %">
            <StockTable rows={GAINERS} rank />
          </Panel>

          <Panel title="Top losers" meta="sample change %">
            <StockTable rows={LOSERS} rank />
          </Panel>

          <Panel title="Most active" meta="sample turnover" className="lg:col-span-2">
            <StockTable rows={ACTIVE} extra="value" rank />
          </Panel>
        </div>
      </main>

      <footer className="flex flex-wrap items-center gap-x-6 gap-y-1 bg-panel-hi px-4 py-2 text-micro uppercase tracking-[0.1em] text-dim">
        <span>Universe <span className="text-ink">demo</span></span>
        <span>Provider <span className="text-ink">sample</span></span>
        <span>Feed <span className="text-ink">static preview</span></span>
        <span className="ml-auto inline-flex items-center gap-1.5 text-dimmer">
          <TerminalSquare aria-hidden="true" className="h-3.5 w-3.5" />
          Connect the database later to unlock the real terminal
        </span>
      </footer>
    </div>
  );
}
