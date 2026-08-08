import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { Panel } from "@/components/terminal/Panel";
import { StockTable } from "@/components/terminal/StockTable";
import { mostActive, refreshBoard, topGainers, topLosers } from "@/lib/stocks";

export const metadata: Metadata = { title: "Top 10 — IDX Terminal" };
export const dynamic = "force-dynamic";

export default async function TopTenPage() {
  const user = await requireUser();
  await refreshBoard(user.id);

  const [gainers, losers, active] = await Promise.all([
    topGainers(10),
    topLosers(10),
    mostActive(10),
  ]);

  return (
    <div className="grid min-h-0 flex-1 gap-px lg:grid-cols-2">
      <Panel title="Top 10 gainers" meta="by change %">
        <StockTable rows={gainers} rank emptyMessage="No quotes yet." />
      </Panel>

      <Panel title="Top 10 losers" meta="by change %">
        <StockTable rows={losers} rank emptyMessage="No quotes yet." />
      </Panel>

      <Panel
        title="Top 10 by turnover"
        meta="rupiah traded"
        className="lg:col-span-2"
      >
        <StockTable
          rows={active}
          extra="value"
          rank
          emptyMessage="No turnover recorded yet."
        />
      </Panel>
    </div>
  );
}
