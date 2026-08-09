import "server-only";

import { getCompanyCatalogEntry } from "@/lib/company-catalog";
import { getLatestIdxStockSummary } from "@/lib/market-data/idx-official";

export type ForeignFlowRow = {
  code: string;
  name: string;
  logoUrl: string | null;
  foreignBuy: number | null;
  foreignSell: number | null;
  netShares: number;
  estimatedNetValue: number | null;
  close: number | null;
};

export async function foreignFlowLeaders(limit = 10) {
  const summary = await getLatestIdxStockSummary();
  const rows = summary.rows.flatMap((row): ForeignFlowRow[] => {
    if (row.foreignNet == null || row.foreignBuy == null || row.foreignSell == null) {
      return [];
    }
    const company = getCompanyCatalogEntry(row.code);
    return [
      {
        code: row.code,
        name: company?.name ?? row.name,
        logoUrl: company?.logoUrl ?? null,
        foreignBuy: row.foreignBuy,
        foreignSell: row.foreignSell,
        netShares: row.foreignNet,
        estimatedNetValue:
          row.close != null ? row.foreignNet * row.close : null,
        close: row.close,
      },
    ];
  });

  if (summary.available && rows.length) {
    return {
      available: true,
      date: summary.date,
      source: "IDX" as const,
      topBuy: rows
        .filter((row) => row.netShares > 0)
        .sort((a, b) => b.netShares - a.netShares)
        .slice(0, limit),
      topSell: rows
        .filter((row) => row.netShares < 0)
        .sort((a, b) => a.netShares - b.netShares)
        .slice(0, limit),
    };
  }

  const invezgo = await invezgoForeignFlow(limit);
  if (invezgo) return invezgo;

  return {
    available: false,
    date: null,
    source: null,
    topBuy: [] as ForeignFlowRow[],
    topSell: [] as ForeignFlowRow[],
  };
}

type InvezgoFlowItem = {
  code?: string;
  name?: string;
  price?: number;
  value?: number;
  volume?: number;
  logo?: string;
};

async function invezgoForeignFlow(limit: number) {
  const apiKey = process.env.INVEZGO_KEY;
  if (!apiKey) return null;

  for (const date of recentWeekdays()) {
    try {
      const url = new URL("https://api.invezgo.com/analysis/top/foreign");
      url.searchParams.set("date", date);
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
        cache: "no-store",
      });
      if (response.status === 204) continue;
      if (!response.ok) return null;
      const body = (await response.json()) as {
        accum?: InvezgoFlowItem[];
        dist?: InvezgoFlowItem[];
      };
      const topBuy = mapInvezgoRows(body.accum ?? [], "buy", limit);
      const topSell = mapInvezgoRows(body.dist ?? [], "sell", limit);
      if (!topBuy.length && !topSell.length) continue;
      return {
        available: true,
        date,
        source: "Invezgo" as const,
        topBuy,
        topSell,
      };
    } catch {
      return null;
    }
  }
  return null;
}

function mapInvezgoRows(
  items: InvezgoFlowItem[],
  direction: "buy" | "sell",
  limit: number,
) {
  const sign = direction === "buy" ? 1 : -1;
  return items.slice(0, limit).flatMap((item): ForeignFlowRow[] => {
    const code = item.code?.toUpperCase();
    if (!code || !Number.isFinite(item.volume)) return [];
    const company = getCompanyCatalogEntry(code);
    return [
      {
        code,
        name: company?.name ?? item.name ?? code,
        logoUrl: company?.logoUrl ?? item.logo ?? null,
        foreignBuy: null,
        foreignSell: null,
        netShares: sign * Math.abs(item.volume ?? 0),
        estimatedNetValue:
          typeof item.value === "number" ? sign * Math.abs(item.value) : null,
        close: typeof item.price === "number" ? item.price : null,
      },
    ];
  });
}

function recentWeekdays(limit = 6) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  const cursor = new Date(Date.UTC(read("year"), read("month") - 1, read("day"), 12));
  const dates: string[] = [];
  while (dates.length < limit) {
    if (cursor.getUTCDay() !== 0 && cursor.getUTCDay() !== 6) {
      dates.push(cursor.toISOString().slice(0, 10));
    }
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return dates;
}
