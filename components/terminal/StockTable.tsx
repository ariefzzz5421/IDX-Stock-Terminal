import Link from "next/link";
import { CompanyLogo } from "./CompanyLogo";
import {
  directionClass,
  formatPct,
  formatPrice,
  formatValue,
  formatVolume,
} from "@/lib/format";

export type StockRow = {
  code: string;
  name: string;
  sector: string | null;
  logoUrl: string | null;
  lastPrice: number | null;
  lastChangePct: number | null;
  lastVolume: number | null;
  lastValue: number | null;
  marketCap: number | null;
};

export type Column = "volume" | "value" | "marketCap";

/**
 * The board. Every listing view renders through this so column widths, colour
 * rules and row height stay identical across pages.
 */
export function StockTable({
  rows,
  extra = "volume",
  rank = false,
  emptyMessage = "Nothing to show yet.",
  action,
}: {
  rows: StockRow[];
  extra?: Column;
  /** Number the rows — only meaningful for ranked views. */
  rank?: boolean;
  emptyMessage?: string;
  action?: (row: StockRow) => React.ReactNode;
}) {
  if (rows.length === 0) {
    return <p className="p-4 text-sm leading-relaxed text-dim">{emptyMessage}</p>;
  }

  const extraLabel =
    extra === "volume" ? "Volume" : extra === "value" ? "Value" : "Mkt cap";

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[36rem] text-sm">
        <thead>
          <tr className="sticky top-0 z-10 bg-panel">
            {rank && <Th className="w-10 text-right">#</Th>}
            <Th align="left">Ticker</Th>
            <Th align="left" className="hidden md:table-cell">
              Company
            </Th>
            <Th>Last</Th>
            <Th>Chg %</Th>
            <Th className="hidden sm:table-cell">{extraLabel}</Th>
            {action && (
              <Th className="w-8">
                <span className="sr-only">Actions</span>
              </Th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.code}
              className="group relative border-b border-rule/50 transition-colors hover:bg-panel-hi"
            >
              {rank && (
                <td className="px-2 py-2 text-right text-xs text-dimmer tabular-nums">
                  {index + 1}
                </td>
              )}

              <td className="px-3 py-2">
                <Link
                  href={`/stock/${row.code}`}
                  aria-label={`Open ${row.code} stock detail and orderbook`}
                  className="absolute inset-0 z-0"
                  title={row.name}
                />
                <span className="relative z-10 flex pointer-events-none items-center gap-2.5">
                  <CompanyLogo code={row.code} logoUrl={row.logoUrl} />
                  <span className="flex flex-col leading-tight">
                    <span className="font-bold tracking-[0.05em] text-ink-hi group-hover:text-amber">
                      {row.code}
                    </span>
                    {row.sector && (
                      <span className="text-micro text-dimmer md:hidden">
                        {row.sector}
                      </span>
                    )}
                  </span>
                </span>
              </td>

              <td className="relative z-10 hidden max-w-[1px] pointer-events-none px-3 py-2 md:table-cell">
                <span className="block truncate text-xs text-dim">{row.name}</span>
                {row.sector && (
                  <span className="block truncate text-micro text-dimmer">
                    {row.sector}
                  </span>
                )}
              </td>

              <td className="relative z-10 pointer-events-none px-3 py-2 text-right text-ink">
                {formatPrice(row.lastPrice)}
              </td>

              <td
                className={`relative z-10 pointer-events-none px-3 py-2 text-right font-medium ${directionClass(row.lastChangePct)}`}
              >
                {formatPct(row.lastChangePct)}
              </td>

              <td className="relative z-10 hidden pointer-events-none px-3 py-2 text-right text-xs text-dim sm:table-cell">
                {extra === "volume" && formatVolume(row.lastVolume)}
                {extra === "value" && formatValue(row.lastValue)}
                {extra === "marketCap" && formatValue(row.marketCap)}
              </td>

              {action && <td className="relative z-20 pr-2 text-right">{action(row)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
      className={`border-b border-rule px-3 py-2 text-micro font-medium uppercase tracking-[0.12em] text-dim ${
        align === "left" ? "text-left" : "text-right"
      } ${className}`}
    >
      {children}
    </th>
  );
}
