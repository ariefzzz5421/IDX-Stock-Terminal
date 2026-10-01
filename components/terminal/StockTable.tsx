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
  emptyMessage = "Belum ada data untuk ditampilkan.",
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
    extra === "volume" ? "Volume" : extra === "value" ? "Nilai" : "Kap. pasar";

  return (
    <div className="@container/stocktable min-w-0 overflow-hidden">
      <table className="w-full table-fixed text-xs sm:text-sm">
        <thead>
          <tr className="sticky top-0 z-10 bg-panel">
            {rank && <Th className="w-7 text-right @min-[32rem]/stocktable:w-10">#</Th>}
            <Th align="left">Kode</Th>
            <Th className="w-[4.5rem] @min-[32rem]/stocktable:w-[5.5rem]">Harga</Th>
            <Th className="w-[5rem] @min-[32rem]/stocktable:w-[6rem]">Ubah %</Th>
            <Th className="hidden w-[6.5rem] @min-[32rem]/stocktable:table-cell">{extraLabel}</Th>
            {action && (
              <Th className="w-8">
                <span className="sr-only">Tindakan</span>
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

              <td className="min-w-0 px-2 py-2 @min-[32rem]/stocktable:px-3">
                <Link
                  href={`/asset/${row.code}`}
                  aria-label={`Buka detail saham ${row.code} dan ringkasan bid/offer`}
                  className="absolute inset-0 z-0"
                  title={row.name}
                />
                <span className="pointer-events-none relative z-10 flex min-w-0 items-center gap-2">
                  <CompanyLogo code={row.code} logoUrl={row.logoUrl} />
                  <span className="flex min-w-0 flex-col leading-tight">
                    <span className="font-bold tracking-[0.05em] text-ink-hi group-hover:text-amber">
                      {row.code}
                    </span>
                    <span className="truncate text-micro text-dimmer" title={row.name}>{row.name}</span>
                    <span className="block break-words text-micro text-dimmer @min-[32rem]/stocktable:hidden">{extraLabel}: {extra === "volume" ? formatVolume(row.lastVolume) : formatValue(extra === "value" ? row.lastValue : row.marketCap)}</span>
                  </span>
                </span>
              </td>
              <td className="relative z-10 pointer-events-none px-1 py-2 text-right text-ink tabular-nums @min-[32rem]/stocktable:px-3">
                {formatPrice(row.lastPrice)}
              </td>

              <td
                className={`relative z-10 pointer-events-none px-1 py-2 text-right font-medium tabular-nums @min-[32rem]/stocktable:px-3 ${directionClass(row.lastChangePct)}`}
              >
                {formatPct(row.lastChangePct)}
              </td>

              <td className="relative z-10 hidden pointer-events-none px-3 py-2 text-right text-xs text-dim tabular-nums @min-[32rem]/stocktable:table-cell">
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
