import { SUSPENSION_ARCHIVE_AS_OF, type LongSuspensionRecord } from "./suspension-archive";

export type SuspensionNotice = {
  code: string;
  date: string; // YYYY-MM-DD, official IDX bulletin date
  action: "SUSPEND" | "UNSUSPEND";
  title: string;
};
const MONTH: Record<string,string> = {
  jan:"01",feb:"02",mar:"03",apr:"04",mei:"05",may:"05",jun:"06",
  jul:"07",agu:"08",aug:"08",sep:"09",okt:"10",oct:"10",nov:"11",des:"12",dec:"12",
};
export function parseSuspensionDate(text: string): string | null {
  const x=text.match(/\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|Mei|May|Jun|Jul|Agu|Aug|Sep|Okt|Oct|Nov|Des|Dec)\s+(\d{4})\b/i);
  return x ? x[3]+"-"+MONTH[x[2].toLowerCase()]+"-"+x[1].padStart(2,"0") : null;
}
/** Strictly distinguish opening a trade halt from suspending a stock. */
export function classifySuspensionTitle(title: string): "SUSPEND"|"UNSUSPEND"|null {
  const normalized=title.replace(/\s+/g," ").toLowerCase();
  if (/\b(unsuspend|pembukaan (?:kembali |penghentian sementara)|dibuka kembali|pencabutan suspensi|pembukaan kembali perdagangan)\b/.test(normalized)) return "UNSUSPEND";
  if (/\b(suspend|suspensi|penghentian sementara)\b/.test(normalized)) return "SUSPEND";
  return null;
}
export function parseSuspensionNotice(dateText: string, title: string): SuspensionNotice | null {
  const date=parseSuspensionDate(dateText);
  const code=title.match(/\(([A-Z]{4})\)/)?.[1];
  const action=classifySuspensionTitle(title);
  if (!date || !code || !action) return null;
  return { code,date,action,title:title.trim() };
}

/** The July–November historical bulletin may not be accessible from the server.
 * This single confirmed release is intentionally kept as a dated correction:
 * https://www.idx.co.id/id/berita/suspensi (19 October 2026, MKNT).
 */
export const VERIFIED_NOTICE_FALLBACK: ReadonlyArray<SuspensionNotice> = [
  {code:"MKNT",date:"2026-10-19",action:"UNSUSPEND",
   title:"Pembukaan Penghentian Sementara Perdagangan Efek PT Mitra Komunikasi Nusantara Tbk. (MKNT)"},
];

export type SuspendedRecord=LongSuspensionRecord & {
  basis: "historical-list"|"new-announcement";
  asOf: string;
};
export function reconcileSuspensions(
  archive: ReadonlyArray<LongSuspensionRecord>,
  archiveDate:string,
  notices: ReadonlyArray<SuspensionNotice>,
): SuspendedRecord[] {
  const latest=new Map<string,SuspensionNotice>();
  // A notice on the same day can be a temporary halt followed by reopening.
  for(const notice of [...VERIFIED_NOTICE_FALLBACK,...notices]) {
    if(!/^[A-Z]{4}$/.test(notice.code)||!/^\d{4}-\d{2}-\d{2}$/.test(notice.date)) continue;
    if (notice.date<=archiveDate) continue;
    const old=latest.get(notice.code);
    if(!old || notice.date>old.date || (notice.date===old.date && notice.action==="UNSUSPEND")) latest.set(notice.code,notice);
  }
  const result=new Map<string,SuspendedRecord>();
  for(const row of archive) {
    const newer=latest.get(row.code);
    if(newer?.action==="UNSUSPEND") continue;
    result.set(row.code,{...row,basis:"historical-list",asOf:newer?.date??archiveDate});
  }
  for(const [code,notice] of latest) {
    if(notice.action!=="SUSPEND"||result.has(code)) continue;
    result.set(code,{code,since:notice.date,basis:"new-announcement",asOf:notice.date});
  }
  return [...result.values()].sort((a,b)=>a.code.localeCompare(b.code));
}

export function reconciledArchiveWithoutLiveFeed(archive: ReadonlyArray<LongSuspensionRecord>) {
  return reconcileSuspensions(archive,SUSPENSION_ARCHIVE_AS_OF,[]);
}
