"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  directionClass,
  formatPct,
  formatPrice,
  formatVolume,
} from "@/lib/format";

export type WatchlistRow = {
  code: string;
  name: string;
  price: number | null;
  changePct: number | null;
  volume: number | null;
};

export function Watchlist({ rows }: { rows: WatchlistRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [removing, setRemoving] = useState<string | null>(null);

  async function remove(code: string) {
    setRemoving(code);
    await fetch(`/api/watchlist?code=${encodeURIComponent(code)}`, {
      method: "DELETE",
    });
    setRemoving(null);
    startTransition(() => router.refresh());
  }

  if (rows.length === 0) {
    return (
      <p className="p-3 text-[12px] leading-relaxed text-dim">
        Your watchlist is empty. Type a ticker in the command bar to open it,
        then add it from there.
      </p>
    );
  }

  return (
    <table className="w-full text-[11.5px]">
      <thead>
        <tr className="sticky top-0 bg-panel">
          <th
            scope="col"
            className="border-b border-rule px-2.5 py-1.5 text-left text-[9.5px] font-medium uppercase tracking-[0.1em] text-dim"
          >
            Code
          </th>
          <th
            scope="col"
            className="border-b border-rule px-2.5 py-1.5 text-right text-[9.5px] font-medium uppercase tracking-[0.1em] text-dim"
          >
            Last
          </th>
          <th
            scope="col"
            className="border-b border-rule px-2.5 py-1.5 text-right text-[9.5px] font-medium uppercase tracking-[0.1em] text-dim"
          >
            Chg%
          </th>
          <th
            scope="col"
            className="border-b border-rule px-2.5 py-1.5 text-right text-[9.5px] font-medium uppercase tracking-[0.1em] text-dim"
          >
            Vol
          </th>
          <th scope="col" className="border-b border-rule">
            <span className="sr-only">Remove</span>
          </th>
        </tr>
      </thead>
      <tbody className={pending ? "opacity-60" : undefined}>
        {rows.map((row) => (
          <tr key={row.code} className="group border-b border-rule/50 hover:bg-panel-hi">
            <td className="px-2.5 py-1">
              <Link href={`/stock/${row.code}`} className="block" title={row.name}>
                <span className="font-bold tracking-[0.05em] text-ink-hi">
                  {row.code}
                </span>
              </Link>
            </td>
            <td className="px-2.5 py-1 text-right text-ink">
              {formatPrice(row.price)}
            </td>
            <td className={`px-2.5 py-1 text-right ${directionClass(row.changePct)}`}>
              {formatPct(row.changePct)}
            </td>
            <td className="px-2.5 py-1 text-right text-[10.5px] text-dim">
              {formatVolume(row.volume)}
            </td>
            <td className="pr-2 text-right">
              <button
                type="button"
                onClick={() => remove(row.code)}
                disabled={removing === row.code}
                aria-label={`Remove ${row.code} from watchlist`}
                className="px-1 text-[11px] text-dimmer opacity-0 transition-opacity group-hover:opacity-100 hover:text-down focus-visible:opacity-100"
              >
                ×
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
