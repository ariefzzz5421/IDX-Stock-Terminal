import Link from "next/link";
import type { UiLanguage } from "@/lib/ui-language";
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
  language = "id",
  showDailyValue = false,
}: {
  rows: StockRow[];
  extra?: Column;
  /** Number the rows — only meaningful for ranked views. */
  rank?: boolean;
  emptyMessage?: string;
  action?: (row: StockRow) => React.ReactNode;
  language?: UiLanguage;
  /** Show the provider's daily IDR traded value beside share volume. */
  showDailyValue?: boolean;
}) {
  if (rows.length === 0) {
    return <p className="p-4 text-sm leading-relaxed text-dim">{emptyMessage}</p>;
  }

  const extraLabel =
    extra === "volume" ? "Volume" : extra === "value" ? language === "id" ? "Nilai" : "Value" : language === "id" ? "Kap. pasar" : "Mkt cap";

  return (
    <div className="@container/stocktable min-w-0 overflow-hidden">
      <table className="w-full table-fixed text-xs sm:text-sm">
        <thead>
          <tr className="sticky top-0 z-10 bg-panel">
            {rank && <Th className="w-7 text-right @min-[32rem]/stocktable:w-10">#</Th>}
            <Th align="left">{language === "id" ? "Kode" : "Ticker"}</Th>
            <Th className="w-[4.5rem] @min-[32rem]/stocktable:w-[5.5rem]">{language === "id" ? "Harga" : "Last"}</Th>
            <Th className="w-[5rem] px-1 tracking-normal @min-[32rem]/stocktable:w-[6rem]">Change %</Th>
            <Th className="hidden w-[6.5rem] @min-[32rem]/stocktable:table-cell">{extraLabel}</Th>
            {showDailyValue && <Th className="hidden w-[8rem] @min-[38rem]/stocktable:table-cell">{language === "id" ? "Est. nilai (Rp)" : "Est. traded (IDR)"}</Th>}
            {action && (
              <Th className="w-8">
                <span className="sr-only">{language === "id" ? "Tindakan" : "Action"}</span>
              </Th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.code}
              className="group border-b border-rule/50 transition-colors hover:bg-panel-hi"
            >
              {rank && (
                <td className="p-0 text-right text-xs text-dimmer tabular-nums">
                  <Link href={`/asset/${row.code}`} aria-label={`Buka saham ${row.code}, peringkat ${index + 1}`} className="block px-2 py-2">{index + 1}</Link>
                </td>
              )}

              <td className="min-w-0 p-0">
                <Link
                  href={`/asset/${row.code}`}
                  aria-label={language === "id" ? `Buka detail saham ${row.code} dan ringkasan bid/offer` : `Open ${row.code} stock details and bid/offer summary`}
                  className="flex min-w-0 items-center gap-2 px-2 py-2 @min-[32rem]/stocktable:px-3"
                  title={row.name}
                >
                  <CompanyLogo code={row.code} logoUrl={row.logoUrl} />
                  <span className="flex min-w-0 flex-col leading-tight">
                    <span className="font-bold tracking-[0.05em] text-ink-hi group-hover:text-amber">
                      {row.code}
                    </span>
                    <span className="truncate text-micro text-ink" title={row.name}>{row.name}</span>
                    <span className="block break-words text-micro text-dim @min-[32rem]/stocktable:hidden">{extraLabel}: {extra === "volume" ? formatVolume(row.lastVolume) : formatValue(extra === "value" ? row.lastValue : row.marketCap)}</span>
                    {showDailyValue && <span className="block break-words text-micro text-cyan @min-[38rem]/stocktable:hidden">Est. nilai: {(row.lastValue ?? 0) > 0 ? formatValue(row.lastValue) : "—"}</span>}
                  </span>
                </Link>
              </td>
              <td className="p-0 text-right text-ink tabular-nums">
                <Link href={`/asset/${row.code}`} aria-label={`Buka saham ${row.code}`} className="block px-1 py-2 @min-[32rem]/stocktable:px-3">{formatPrice(row.lastPrice)}</Link>
              </td>

              <td
                className={`p-0 text-right font-medium tabular-nums ${directionClass(row.lastChangePct)}`}
              >
                <Link href={`/asset/${row.code}`} aria-label={`Buka saham ${row.code}`} className="block px-1 py-2 @min-[32rem]/stocktable:px-3">{formatPct(row.lastChangePct)}</Link>
              </td>

              <td className="hidden p-0 text-right text-xs text-dim tabular-nums @min-[32rem]/stocktable:table-cell">
                <Link href={`/asset/${row.code}`} aria-label={`Buka saham ${row.code}`} className="block px-3 py-2">
                  {extra === "volume" && formatVolume(row.lastVolume)}
                  {extra === "value" && formatValue(row.lastValue)}
                  {extra === "marketCap" && formatValue(row.marketCap)}
                </Link>
              </td>

              {showDailyValue && <td className="hidden p-0 text-right text-xs text-cyan tabular-nums @min-[38rem]/stocktable:table-cell"><Link href={`/asset/${row.code}`} className="block px-3 py-2">{(row.lastValue ?? 0) > 0 ? formatValue(row.lastValue) : "—"}</Link></td>}

              {action && <td className="pr-2 text-right">{action(row)}</td>}
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
