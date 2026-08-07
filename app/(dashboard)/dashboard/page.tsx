import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/session";
import { refreshQuotes } from "@/lib/market-data/sync";
import { Panel } from "@/components/terminal/Panel";
import { Watchlist } from "@/components/terminal/Watchlist";
import { directionClass, formatPct, formatPrice, formatValue } from "@/lib/format";

export const metadata: Metadata = { title: "Dashboard — IDX Terminal" };

// Quotes are fetched per request; nothing here may be prerendered.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();

  const watchlist = await prisma.watchlist.findMany({
    where: { userId: user.id },
    orderBy: { sortOrder: "asc" },
    include: { stock: true },
  });

  // Refresh only what is on screen, so the free-tier provider isn't hammered.
  await refreshQuotes(watchlist.map((row) => row.stockCode));

  const [rows, gainers, losers, mostActive] = await Promise.all([
    prisma.watchlist.findMany({
      where: { userId: user.id },
      orderBy: { sortOrder: "asc" },
      include: { stock: true },
    }),
    prisma.stock.findMany({
      where: { lastChangePct: { gt: 0 } },
      orderBy: { lastChangePct: "desc" },
      take: 10,
    }),
    prisma.stock.findMany({
      where: { lastChangePct: { lt: 0 } },
      orderBy: { lastChangePct: "asc" },
      take: 10,
    }),
    prisma.stock.findMany({
      where: { lastValue: { not: null } },
      orderBy: { lastValue: "desc" },
      take: 10,
    }),
  ]);

  const watchlistRows = rows.map((row) => ({
    code: row.stock.code,
    name: row.stock.name,
    price: row.stock.lastPrice,
    changePct: row.stock.lastChangePct,
    volume: row.stock.lastVolume,
  }));

  return (
    <div className="grid min-h-0 flex-1 gap-px lg:grid-cols-[300px_minmax(0,1fr)]">
      <Panel title="Watchlist" meta={`${watchlistRows.length} issues`}>
        <Watchlist rows={watchlistRows} />
      </Panel>

      <div className="grid min-h-0 gap-px md:grid-cols-2 lg:grid-rows-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel title="Top gainers" meta="by change %">
          <MoverTable rows={gainers} />
        </Panel>

        <Panel title="Top losers" meta="by change %">
          <MoverTable rows={losers} />
        </Panel>

        <Panel
          title="Most active"
          meta="by turnover"
          className="md:col-span-2"
        >
          <MoverTable rows={mostActive} showValue />
        </Panel>
      </div>
    </div>
  );
}

type MoverRow = {
  code: string;
  name: string;
  sector: string | null;
  lastPrice: number | null;
  lastChangePct: number | null;
  lastValue: number | null;
};

function MoverTable({
  rows,
  showValue = false,
}: {
  rows: MoverRow[];
  showValue?: boolean;
}) {
  if (rows.length === 0) {
    return (
      <p className="p-3 text-[12px] leading-relaxed text-dim">
        No quotes yet. Add tickers to your watchlist — prices are fetched for
        what you follow, then land here.
      </p>
    );
  }

  return (
    <table className="w-full text-[11.5px]">
      <thead>
        <tr className="sticky top-0 bg-panel">
          <Th align="left">Code</Th>
          <Th align="left" className="hidden sm:table-cell">
            Name
          </Th>
          <Th>Last</Th>
          <Th>Chg%</Th>
          {showValue && <Th>Value</Th>}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.code} className="border-b border-rule/50 hover:bg-panel-hi">
            <td className="px-2.5 py-1">
              <Link
                href={`/stock/${row.code}`}
                className="font-bold tracking-[0.05em] text-ink-hi hover:text-amber"
              >
                {row.code}
              </Link>
            </td>
            <td className="hidden max-w-[1px] truncate px-2.5 py-1 text-[10.5px] text-dim sm:table-cell">
              {row.name}
            </td>
            <td className="px-2.5 py-1 text-right text-ink">
              {formatPrice(row.lastPrice)}
            </td>
            <td
              className={`px-2.5 py-1 text-right ${directionClass(row.lastChangePct)}`}
            >
              {formatPct(row.lastChangePct)}
            </td>
            {showValue && (
              <td className="px-2.5 py-1 text-right text-[10.5px] text-dim">
                {formatValue(row.lastValue)}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Th({
  children,
  align = "right",
  className = "",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
  className?: string;
}) {
  return (
    <th
      scope="col"
      className={`border-b border-rule px-2.5 py-1.5 text-[9.5px] font-medium uppercase tracking-[0.1em] text-dim ${
        align === "left" ? "text-left" : "text-right"
      } ${className}`}
    >
      {children}
    </th>
  );
}
