import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/session";
import { marketData } from "@/lib/market-data";
import { refreshQuotes } from "@/lib/market-data/sync";
import { Panel } from "@/components/terminal/Panel";
import { Chart } from "@/components/terminal/Chart";
import { WatchlistToggle } from "@/components/terminal/WatchlistToggle";
import {
  directionClass,
  formatChange,
  formatPct,
  formatPrice,
  formatValue,
  formatVolume,
} from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/stock/[code]">): Promise<Metadata> {
  const { code } = await params;
  return { title: `${code.toUpperCase()} — IDX Terminal` };
}

export default async function StockPage({ params }: PageProps<"/stock/[code]">) {
  const user = await requireUser();
  const { code: raw } = await params;
  const code = raw.toUpperCase();

  const stock = await prisma.stock.findUnique({ where: { code } });
  if (!stock) notFound();

  const [, candles, watched] = await Promise.all([
    refreshQuotes([code]),
    marketData.getOHLCV(code, "5m", 120).catch((error) => {
      console.error(`[stock] OHLCV for ${code} failed:`, error);
      return [];
    }),
    prisma.watchlist.findUnique({
      where: { userId_stockCode: { userId: user.id, stockCode: code } },
      select: { id: true },
    }),
  ]);

  // Re-read: refreshQuotes has just written the latest snapshot.
  const fresh = (await prisma.stock.findUnique({ where: { code } })) ?? stock;
  const change =
    fresh.lastPrice != null && fresh.prevClose != null
      ? fresh.lastPrice - fresh.prevClose
      : null;

  return (
    <div className="grid min-h-0 flex-1 gap-px lg:grid-rows-[auto_minmax(0,1fr)]">
      {/* ---- quote header ---- */}
      <section className="flex flex-wrap items-end gap-x-8 gap-y-3 bg-panel px-3.5 py-3">
        <div className="flex flex-col gap-0.5">
          <h1 className="font-display text-2xl font-bold leading-none tracking-[0.1em] text-amber">
            {fresh.code}
          </h1>
          <p className="text-[10.5px] text-dim">
            {fresh.name}
            {fresh.sector ? ` · ${fresh.sector}` : ""}
          </p>
        </div>

        <div>
          <div className="text-2xl font-bold leading-none text-ink-hi">
            {formatPrice(fresh.lastPrice)}
          </div>
          <div className={`mt-1 text-[11.5px] ${directionClass(change)}`}>
            {formatChange(change)} &nbsp; {formatPct(fresh.lastChangePct)}
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-4">
          <Stat k="Prev close" v={formatPrice(fresh.prevClose)} />
          <Stat k="Volume" v={formatVolume(fresh.lastVolume)} />
          <Stat k="Value" v={formatValue(fresh.lastValue)} />
          <Stat
            k="Updated"
            v={fresh.updatedAt.toISOString().slice(11, 19) + " UTC"}
          />
        </dl>

        <div className="ml-auto">
          <WatchlistToggle code={code} initiallyWatched={Boolean(watched)} />
        </div>
      </section>

      {/* ---- chart ---- */}
      <Panel
        title="Chart"
        meta={`5m · ${candles.length} bars · ${marketData.name}`}
        bodyClassName="min-h-[320px]"
      >
        <Chart candles={candles} />
      </Panel>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[9.5px] uppercase tracking-[0.1em] text-dim">{k}</dt>
      <dd className="text-[11.5px] text-ink">{v}</dd>
    </div>
  );
}
