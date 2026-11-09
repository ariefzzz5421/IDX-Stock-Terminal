import "server-only";

import * as cheerio from "cheerio";
import { parseSuspensionNotice, reconcileSuspensions, type SuspendedRecord, type SuspensionNotice } from "./suspension-status";
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


export type ReconciledSuspensionReference={
  asOf:string;
  rows:SuspendedRecord[];
  origin:SuspensionReference["origin"];
  announcementsFetched:boolean;
  note:string;
};

/** The public announcement table often returns only its first page and may
 * reject automated access. All notices are signed off by the official IDX URL,
 * and only fully parsed rows can change the current displayed list.
 */
async function recentSuspensionNotices():Promise<SuspensionNotice[]|null>{
  try{
    const response=await fetch("https://www.idx.co.id/id/berita/suspensi",{
      next:{revalidate:60*60},
      signal:AbortSignal.timeout(5500),
      headers:{Accept:"text/html"},
    });
    if(!response.ok)return null;
    const $=cheerio.load(await response.text());
    const notices:SuspensionNotice[]=[];
    $("table tbody tr").each((_,row)=>{
      const td=$(row).find("td");
      if(td.length<2)return;
      const date=td.eq(0).text().replace(/\s+/g," ").trim();
      const title=td.eq(1).text().replace(/\s+/g," ").trim();
      const result=parseSuspensionNotice(date,title);
      if(result)notices.push(result);
    });
    return notices.length ? notices : null;
  }catch{return null;}
}

export async function getReconciledSuspensions():Promise<ReconciledSuspensionReference>{
  const [archive,notices]=await Promise.all([getLongSuspensions(),recentSuspensionNotices()]);
  return {
    ...archive,
    rows:reconcileSuspensions(archive.rows,archive.asOf,notices??[]),
    announcementsFetched:notices!==null,
    note:notices===null?
      "Arsip resmi dan koreksi unsuspend yang telah diverifikasi; pengumuman terbaru tidak berhasil dimuat. Status live belum dapat dipastikan.":
      "Arsip resmi digabung dengan pengumuman BEI terbaru yang dapat dibaca. Halaman publik BEI dapat membatasi riwayat; status bukan jaminan live.",
  };
}
