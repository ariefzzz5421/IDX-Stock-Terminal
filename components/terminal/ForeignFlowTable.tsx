import Link from "next/link";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { CompanyLogo } from "./CompanyLogo";
import type { ForeignFlowRow } from "@/lib/foreign-flow";
import { formatPrice, formatValue, formatVolume } from "@/lib/format";

export function ForeignFlowTable({
  rows,
  direction,
  source,
}: {
  rows: ForeignFlowRow[];
  direction: "buy" | "sell";
  source: "IDX" | "Invezgo";
}) {
  if (!rows.length) {
    return (
      <p className="p-5 text-sm leading-relaxed text-dim">
        Tidak ada data untuk sisi transaksi ini pada snapshot yang tersedia.
      </p>
    );
  }

  const Icon = direction === "buy" ? ArrowDownToLine : ArrowUpFromLine;
  const tone = direction === "buy" ? "text-up" : "text-down";

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[38rem] text-sm">
        <thead>
          <tr className="bg-panel">
            <Th className="w-10 text-right">#</Th>
            <Th align="left">Kode</Th>
            <Th>Beli</Th>
            <Th>Jual</Th>
            <Th>Saham neto</Th>
            <Th>{source === "IDX" ? "Est. nilai neto" : "Nilai penyedia"}</Th>
            <Th>Penutupan</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.code}
              className="group border-b border-rule/50 transition-colors hover:bg-panel-hi"
            >
              <td className="p-0 text-right text-xs text-dimmer tabular-nums">
                <Link href={`/asset/${row.code}`} aria-label={`Buka saham ${row.code}`} className="block px-2 py-2">{index + 1}</Link>
              </td>
              <td className="p-0">
                <Link
                  href={`/asset/${row.code}`}
                  aria-label={`Buka detail saham ${row.code}`}
                  className="flex items-center gap-2.5 px-3 py-2"
                >
                  <CompanyLogo code={row.code} logoUrl={row.logoUrl} />
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 font-bold tracking-[0.05em] text-ink-hi group-hover:text-amber">
                      <Icon aria-hidden="true" className={`h-3.5 w-3.5 ${tone}`} />
                      {row.code}
                    </span>
                    <span className="block max-w-52 truncate text-micro text-dimmer">
                      {row.name}
                    </span>
                  </span>
                </Link>
              </td>
              <Td code={row.code}>{formatVolume(row.foreignBuy)}</Td>
              <Td code={row.code}>{formatVolume(row.foreignSell)}</Td>
              <Td code={row.code} className={`font-semibold ${tone}`}>
                {direction === "buy" ? "+" : ""}
                {formatVolume(row.netShares)}
              </Td>
              <Td code={row.code}>{formatValue(row.estimatedNetValue)}</Td>
              <Td code={row.code}>{formatPrice(row.close)}</Td>
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

function Td({ children, code, className = "" }: { children: React.ReactNode; code: string; className?: string }) {
  return (
    <td className={`p-0 text-right text-xs text-dim ${className}`}>
      <Link href={`/asset/${code}`} aria-label={`Buka saham ${code}`} className="block px-3 py-2">{children}</Link>
    </td>
  );
}
