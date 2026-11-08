import Link from "next/link";
import type { UiLanguage } from "@/lib/ui-language";
import { CompanyLogo } from "./CompanyLogo";
import { wasInSuspensionArchive, SUSPENSION_ARCHIVE_AS_OF } from "@/lib/market-data/suspension-archive";
import {
  directionClass,
  formatCompactMarketCap,
  formatCompactVolume,
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
  /** Distinguish provider turnover from old cached/derived values. */
  valueSource?: "reported" | "estimated" | "unverified";
  marketStatus?: "ARA_INDICATIVE" | "ARB_INDICATIVE" | "SUSPEND_CONFIRMED" | null;
};

export type Column = "volume" | "value" | "marketCap";

function ValueLabel({ row }: { row: StockRow }) {
  if (row.lastValue == null || !Number.isFinite(row.lastValue) || row.lastValue <= 0) return <>—</>;
  return <>
    {formatValue(row.lastValue)}
    {row.valueSource !== "reported" && <span className="ml-1 text-[10px] font-normal text-dim" title="Sumber nilai transaksi belum terverifikasi. Nilai tersimpan dapat merupakan estimasi harga terakhir × volume.">({row.valueSource === "estimated" ? "estimasi" : "indikatif"})</span>}
  </>;
}

function StatusLabel({ row }: { row: StockRow }) {
  // A dated >6-month archive is historical evidence, not an active trade halt.
  const archived = wasInSuspensionArchive(row.code);
  if (!row.marketStatus && !archived) return null;
  return <>
    {row.marketStatus && <span
      title={row.marketStatus === "SUSPEND_CONFIRMED" ? "Suspensi terkonfirmasi dari BEI" : "Indikasi harga pada batas auto rejection dari snapshot pasar; cek status resmi di BEI atau broker"}
      className={"rounded-sm border px-1 py-0.5 text-[9px] font-semibold leading-none tracking-normal " + (row.marketStatus === "ARA_INDICATIVE" ? "border-up/50 text-up" : "border-down/50 text-down")}
    >{row.marketStatus === "ARA_INDICATIVE" ? "ARA" : row.marketStatus === "ARB_INDICATIVE" ? "ARB" : "SUSPEND"}</span>}
    {archived && <span
      title={"Riwayat suspensi lebih dari enam bulan menurut BEI per " + SUSPENSION_ARCHIVE_AS_OF + ". Bukan konfirmasi masih suspend hari ini; cek pengumuman unsuspend terbaru."}
      className="rounded-sm border border-amber-dim/60 px-1 py-0.5 text-[9px] font-semibold leading-none tracking-normal text-amber-dim"
    >ARSIP SUSP.</span>}
  </>;
}

function MobileMetric({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex min-w-0 items-baseline gap-1.5 leading-[1.45]">
    <dt className="w-12 shrink-0 text-[11px] font-semibold tracking-wide text-dim">{label}</dt>
    <span aria-hidden="true" className="text-dimmer">|</span>
    <dd className="min-w-0 break-words text-[11px] font-medium text-ink">{children}</dd>
  </div>;
}

/**
 * Shared IDX stock board.
 * A spacious card layout is used for narrow containers/phones. The traditional
 * table remains at >= 48rem of container width, including on desktop screens.
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
  rank?: boolean;
  emptyMessage?: string;
  action?: (row: StockRow) => React.ReactNode;
  language?: UiLanguage;
  showDailyValue?: boolean;
}) {
  if (rows.length === 0) return <p className="p-4 text-sm leading-relaxed text-dim">{emptyMessage}</p>;

  const extraLabel = extra === "volume" ? "Volume" : extra === "value" ? "Value" : language === "id" ? "Kap. pasar" : "Mkt cap";

  return (
    <div className="@container/stocktable min-w-0 w-full overflow-hidden">
      {/* Mobile/narrow panel: one price column, all market metrics below the issuer. */}
      <ol className="divide-y-2 divide-rule-hi/70 @min-[48rem]/stocktable:hidden">
        {rows.map((row, index) => (
          <li key={row.code} className="group px-3 py-4 transition-colors hover:bg-panel-hi sm:px-4">
            <div className={"grid min-w-0 items-start gap-x-2.5 " + (rank ? "grid-cols-[1.1rem_2.25rem_minmax(0,1fr)_auto]" : "grid-cols-[2.25rem_minmax(0,1fr)_auto]")}>
              {rank && <span className="pt-1 text-xs font-bold tabular-nums text-ink">{index + 1}</span>}
              <Link href={"/asset/" + row.code} className="mt-0.5 shrink-0" aria-label={"Buka saham " + row.code}>
                <CompanyLogo code={row.code} logoUrl={row.logoUrl} size="md" />
              </Link>
              <div className="min-w-0">
                <Link href={"/asset/" + row.code} className="inline-flex min-w-0 max-w-full flex-wrap items-center gap-x-1.5 gap-y-1 hover:text-amber">
                  <strong className="font-display text-base font-bold tracking-[0.035em] text-ink-hi group-hover:text-amber">{row.code}</strong>
                  <StatusLabel row={row} />
                </Link>
                <p className="mt-0.5 line-clamp-2 break-words text-[11px] leading-4 text-ink" title={row.name}>{row.name}</p>
                <dl className="mt-2 space-y-1">
                  <MobileMetric label="MCAP">{formatCompactMarketCap(row.marketCap)}</MobileMetric>
                  <MobileMetric label="Volume">{formatCompactVolume(row.lastVolume)}</MobileMetric>
                  <MobileMetric label="Value"><ValueLabel row={row} /></MobileMetric>
                </dl>
                {action && <div className="mt-2">{action(row)}</div>}
              </div>
              <Link href={"/asset/" + row.code} className="ml-1 flex shrink-0 flex-col items-end gap-1 pt-0.5 text-right tabular-nums">
                <span className="whitespace-nowrap text-lg font-extrabold leading-6 text-ink-hi">{formatPrice(row.lastPrice)}</span>
                <span className={"whitespace-nowrap text-[11px] font-semibold leading-4 " + directionClass(row.lastChangePct)}>{formatPct(row.lastChangePct)}</span>
              </Link>
            </div>
          </li>
        ))}
      </ol>

      {/* Wider panels preserve the dense terminal table. */}
      <div className="hidden @min-[48rem]/stocktable:block">
        <table className="w-full table-fixed text-xs sm:text-sm">
          <thead>
            <tr className="sticky top-0 z-10 bg-panel">
              {rank && <Th className="w-10 text-right">#</Th>}
              <Th align="left"> {language === "id" ? "Kode" : "Ticker"} </Th>
              <Th className="w-[6rem]">{language === "id" ? "Harga" : "Last"}</Th>
              <Th className="w-[6rem] tracking-normal">Change %</Th>
              <Th className="w-[7rem]">{extraLabel}</Th>
              {showDailyValue && <>
                <Th className="w-[7rem]">MCAP</Th>
                <Th className="w-[10rem]">Value (Rp)</Th>
              </>}
              {action && <Th className="w-12"><span className="sr-only">{language === "id" ? "Tindakan" : "Action"}</span></Th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.code} className="group border-b-2 border-rule-hi/60 transition-colors hover:bg-panel-hi">
                {rank && <td className="p-0 text-right text-xs font-bold tabular-nums text-ink">
                  <Link href={"/asset/" + row.code} className="block px-2 py-3">{index + 1}</Link>
                </td>}
                <td className="min-w-0 p-0">
                  <Link href={"/asset/" + row.code} title={row.name} className="flex min-w-0 items-center gap-2.5 px-3 py-3">
                    <CompanyLogo code={row.code} logoUrl={row.logoUrl} />
                    <span className="flex min-w-0 flex-col gap-1 leading-tight">
                      <span className="flex flex-wrap items-center gap-1.5 font-bold tracking-wide text-ink-hi group-hover:text-amber">
                        {row.code}<StatusLabel row={row} />
                      </span>
                      <span className="truncate text-micro text-ink" title={row.name}>{row.name}</span>
                    </span>
                  </Link>
                </td>
                <td className="p-0 text-right font-bold tabular-nums text-ink-hi"><Link href={"/asset/" + row.code} className="block px-2 py-3">{formatPrice(row.lastPrice)}</Link></td>
                <td className={"p-0 text-right font-semibold tabular-nums " + directionClass(row.lastChangePct)}><Link href={"/asset/" + row.code} className="block px-2 py-3">{formatPct(row.lastChangePct)}</Link></td>
                <td className="p-0 text-right text-xs tabular-nums text-dim"><Link href={"/asset/" + row.code} className="block px-3 py-3">
                  {extra === "volume" ? formatVolume(row.lastVolume) : formatValue(extra === "value" ? row.lastValue : row.marketCap)}
                </Link></td>
                {showDailyValue && <>
                  <td className="p-0 text-right text-xs tabular-nums text-dim"><Link href={"/asset/" + row.code} className="block px-3 py-3">{formatCompactMarketCap(row.marketCap)}</Link></td>
                  <td className="p-0 text-right text-xs tabular-nums text-cyan"><Link href={"/asset/" + row.code} className="block px-3 py-3"><ValueLabel row={row} /></Link></td>
                </>}
                {action && <td className="px-2 py-3 text-right">{action(row)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children, align = "right", className = "" }: {
  children: React.ReactNode;
  align?: "left" | "right";
  className?: string;
}) {
  return <th scope="col" className={"border-b border-rule px-3 py-3 text-micro font-semibold uppercase tracking-[0.08em] text-dim " + (align === "left" ? "text-left " : "text-right ") + className}>{children}</th>;
}
