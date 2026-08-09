import Link from "next/link";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { CompanyLogo } from "./CompanyLogo";
import type { ForeignFlowRow } from "@/lib/foreign-flow";
import { formatPrice, formatValue, formatVolume } from "@/lib/format";

export function ForeignFlowTable({
  rows,
  direction,
}: {
  rows: ForeignFlowRow[];
  direction: "buy" | "sell";
}) {
  if (!rows.length) {
    return (
      <p className="p-5 text-sm leading-relaxed text-dim">
        Official foreign-flow data is unavailable right now. The terminal will
        not estimate or fabricate a ranking.
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
            <Th align="left">Ticker</Th>
            <Th>Buy</Th>
            <Th>Sell</Th>
            <Th>Net shares</Th>
            <Th>Est. net value</Th>
            <Th>Close</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.code}
              className="group relative border-b border-rule/50 transition-colors hover:bg-panel-hi"
            >
              <td className="px-2 py-2 text-right text-xs text-dimmer tabular-nums">
                {index + 1}
              </td>
              <td className="px-3 py-2">
                <Link
                  href={`/stock/${row.code}`}
                  aria-label={`Open ${row.code} stock detail`}
                  className="absolute inset-0 z-0"
                />
                <span className="relative z-10 flex pointer-events-none items-center gap-2.5">
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
                </span>
              </td>
              <Td>{formatVolume(row.foreignBuy)}</Td>
              <Td>{formatVolume(row.foreignSell)}</Td>
              <Td className={`font-semibold ${tone}`}>
                {direction === "buy" ? "+" : ""}
                {formatVolume(row.netShares)}
              </Td>
              <Td>{formatValue(row.estimatedNetValue)}</Td>
              <Td>{formatPrice(row.close)}</Td>
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

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={`relative z-10 pointer-events-none px-3 py-2 text-right text-xs text-dim ${className}`}>
      {children}
    </td>
  );
}
