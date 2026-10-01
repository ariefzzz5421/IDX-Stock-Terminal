import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Database, Eye, TerminalSquare } from "lucide-react";
import { MarketStatusBadge } from "@/components/terminal/MarketStatusBadge";
import { Panel } from "@/components/terminal/Panel";
import { ResizableSplit } from "@/components/terminal/ResizableSplit";
import { StockTable, type StockRow } from "@/components/terminal/StockTable";
import { NAV_ITEMS } from "@/lib/navigation";
import { MarketVolumeTape } from "@/components/terminal/MarketVolumeTape";
import { TrendingPopup } from "@/components/terminal/TrendingPopup";
import type { TrendingStock } from "@/lib/market-data/trending";
import { missingSettings } from "@/lib/config";

export const metadata: Metadata = { title: "Preview — IDX Terminal" };
export const dynamic = "force-dynamic";

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
  (a, b) => (b.lastVolume ?? 0) - (a.lastVolume ?? 0),
);

const PREVIEW_TRENDING: TrendingStock[] = [...ACTIVE, ...LOSERS]
  .sort((a, b) => (b.lastVolume ?? 0) - (a.lastVolume ?? 0))
  .slice(0, 10)
  .map((stock) => ({
    code: stock.code,
    name: stock.name,
    logoUrl: stock.logoUrl,
    lastPrice: stock.lastPrice,
    turnover: stock.lastValue ?? 0,
    volume: stock.lastVolume ?? 0,
    marketCap: stock.marketCap,
    changes: { day: stock.lastChangePct, week: null, month: null },
  }));

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

export default function PreviewPage() {
  if (missingSettings().length === 0) redirect("/dashboard");
  return (
    <div className="flex min-h-full flex-1 flex-col gap-px bg-rule">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 bg-amber/10 px-4 py-2 text-xs text-amber">
        <span className="inline-flex items-center gap-2 font-bold uppercase tracking-[0.12em]">
          <Eye aria-hidden="true" className="h-3.5 w-3.5" />
          Mode pratinjau
        </span>
        <span className="text-dim">
          Tampilan contoh dengan angka simulasi. Data pasar di sini bukan harga terkini.
        </span>
        <Link href="/" className="ml-auto text-ink underline-offset-4 hover:text-amber hover:underline">
          Kembali ke terminal
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
          Cari kode saham… <span className="ml-auto text-micro uppercase tracking-[0.1em]">contoh</span>
        </div>

        <div className="flex items-center bg-panel">
          <MarketStatusBadge />
        </div>

        <div className="flex items-center gap-2 bg-panel px-4 text-micro uppercase tracking-[0.1em] text-dim">
          <Database aria-hidden="true" className="h-3.5 w-3.5 text-amber" />
          Data simulasi
        </div>
      </header>

      <nav aria-label="Menu pratinjau terminal" className="terminal-nav flex items-stretch gap-px overflow-x-auto bg-rule">
        {NAV_ITEMS.map((tab, index) => (
          <Link
            key={tab.href}
            href={tab.href === "/lokasi-bisnis" ? "/preview/lokasi-bisnis" : tab.href === "/dashboard" ? "/preview" : tab.href}
            className={`whitespace-nowrap px-4 py-2 text-xs uppercase tracking-[0.12em] ${
              index === 0
                ? "bg-panel text-amber shadow-[inset_0_-2px_0_0_var(--color-amber)]"
                : "bg-panel-hi text-dim"
            }`}
          >
            {tab.shortLabel ?? tab.label}
          </Link>
        ))}
      </nav>

      <MarketVolumeTape stocks={PREVIEW_TRENDING} demo />
      <TrendingPopup stocks={PREVIEW_TRENDING} demo />

      <main className="flex min-h-0 flex-1 flex-col">
        <ResizableSplit storageKey="preview" defaultWidth={340} leftLabel="watchlist" collapseButtonPlacement="panel" mobileDrawerCount={WATCHLIST.length} left={
          <Panel title="Watchlist" meta={`${WATCHLIST.length} sample stocks`} className="h-full" headerClassName="pr-12">
            <StockTable rows={WATCHLIST} extra="volume" />
          </Panel>
        } right={<div className="grid h-full min-h-0 gap-px lg:grid-cols-2 xl:pr-8">
          <Panel title="Kenaikan terbesar" meta="contoh perubahan %">
            <StockTable rows={GAINERS} extra="volume" rank />
          </Panel>

          <Panel title="Penurunan terbesar" meta="contoh perubahan %">
            <StockTable rows={LOSERS} extra="volume" rank />
          </Panel>

          <Panel title="Volume tertinggi" meta="contoh volume harian" className="lg:col-span-2">
            <StockTable rows={ACTIVE} extra="volume" rank />
          </Panel>
        </div>} />
      </main>

      <footer className="flex flex-wrap items-center gap-x-6 gap-y-1 bg-panel-hi px-4 py-2 text-micro uppercase tracking-[0.1em] text-dim">
        <span>Emiten <span className="text-ink">contoh</span></span>
        <span>Penyedia <span className="text-ink">simulasi</span></span>
        <span>Data <span className="text-ink">pratinjau statis</span></span>
        <span className="ml-auto inline-flex items-center gap-1.5 text-dimmer">
          <TerminalSquare aria-hidden="true" className="h-3.5 w-3.5" />
          Buka terminal utama untuk data pasar
        </span>
      </footer>
    </div>
  );
}
