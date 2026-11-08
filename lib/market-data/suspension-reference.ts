import "server-only";

import * as cheerio from "cheerio";
import {
  SUSPENSION_ARCHIVE, SUSPENSION_ARCHIVE_AS_OF, SUSPENSION_ARCHIVE_SOURCE,
  type LongSuspensionRecord,
} from "./suspension-archive";

export type SuspensionReference = {
  asOf: string;
  rows: LongSuspensionRecord[];
  origin: "BEI website" | "dated built-in archive";
};

const MONTHS: Record<string, string> = {
  januari:"01",februari:"02",maret:"03",april:"04",mei:"05",juni:"06",
  juli:"07",agustus:"08",september:"09",oktober:"10",november:"11",desember:"12",
};

function parseAsOf(text: string): string | null {
  const match = text.match(/informasi\s+per\s+tanggal\s+(\d{1,2})\s+([a-z]+)\s+(\d{4})/i);
  if (!match) return null;
  const month = MONTHS[match[2].toLowerCase()];
  return month ? match[3] + "-" + month + "-" + match[1].padStart(2, "0") : null;
}

/**
 * BEI updates its "suspension >6 months" list periodically, not per trade.
 * Parse only if a dated, sufficiently complete stock-code table is present.
 * Failure keeps the documented older dated archive, NOT a fabricated live status.
 */
export function parseBeIArchiveHtml(html: string): { asOf: string; rows: LongSuspensionRecord[] } | null {
  const $ = cheerio.load(html);
  const asOf = parseAsOf($("body").text().replace(/\s+/g, " "));
  if (!asOf || asOf < SUSPENSION_ARCHIVE_AS_OF) return null;
  const records = new Map<string, LongSuspensionRecord>();
  $("table tr").each((_index, tr) => {
    const values = $(tr).find("td").map((_, td) => $(td).text().replace(/\s+/g, " ").trim()).get();
    if (values.length < 7) return;
    const code = values[1]?.toUpperCase();
    const since = values[6];
    if (/^[A-Z]{4}$/.test(code ?? "") && /^\d{1,2}-[A-Za-z]{3}-\d{2,4}$/.test(since ?? "")) {
      records.set(code, { code, since });
    }
  });
  const rows = [...records.values()].sort((a,b) => a.code.localeCompare(b.code));
  if (rows.length < 30 || rows.length > 1500) return null;
  return { asOf, rows };
}

export async function getLongSuspensions(): Promise<SuspensionReference> {
  try {
    const res = await fetch(SUSPENSION_ARCHIVE_SOURCE, {
      next: { revalidate: 6 * 60 * 60 },
      signal: AbortSignal.timeout(7_000),
      headers: { Accept: "text/html" },
    });
    if (res.ok) {
      const parsed = parseBeIArchiveHtml(await res.text());
      if (parsed) return { ...parsed, origin: "BEI website" };
    }
  } catch {
    // Live public listing may block server-to-server traffic.
  }
  return {
    asOf: SUSPENSION_ARCHIVE_AS_OF,
    rows: [...SUSPENSION_ARCHIVE],
    origin: "dated built-in archive",
  };
}
