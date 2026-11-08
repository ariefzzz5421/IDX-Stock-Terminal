/**
 * DATED historical BEI source: Suspensi Lebih dari 6 Bulan, as of 30 June 2026.
 * Source: https://www.idx.id/id/perusahaan-tercatat/suspensi-6-bulan/
 * These entries are NOT live suspend flags; shares can be unsuspended since
 * this reference date. For instance MKNT had an unsuspension notice in Oct.
 * A "no trading" or "ARB" signal is never enough to assert suspension.
 */
export const SUSPENSION_ARCHIVE_AS_OF = "2026-06-30";
export const SUSPENSION_ARCHIVE_SOURCE = "https://www.idx.id/id/perusahaan-tercatat/suspensi-6-bulan/";
export const SUSPENSION_ANNOUNCEMENTS_SOURCE = "https://www.idx.co.id/id/berita/suspensi";

export type LongSuspensionRecord = { code: string; since: string };
export const SUSPENSION_ARCHIVE: ReadonlyArray<LongSuspensionRecord> = [
  { code: "ALMI", since: "30-Okt-24" },
  { code: "ALTO", since: "30-Jun-25" },
  { code: "ARMY", since: "02-Des-19" },
  { code: "ARTI", since: "02-Jul-24" },
  { code: "BEBS", since: "17-Feb-25" },
  { code: "BIKA", since: "02-Jul-24" },
  { code: "BIMA", since: "19-Nov-25" },
  { code: "BOSS", since: "16-Feb-24" },
  { code: "BTEL", since: "27-Mei-19" },
  { code: "CBMF", since: "16-Feb-23" },
  { code: "CPRI", since: "03-Jul-23" },
  { code: "DEAL", since: "16-Feb-24" },
  { code: "DPNS", since: "31-Okt-25" },
  { code: "ETWA", since: "01-Feb-24" },
  { code: "FASW", since: "31-Jan-25" },
  { code: "FIMP", since: "13-Agu-25" },
  { code: "GAMA", since: "03-Jul-23" },
  { code: "GLOB", since: "27-Okt-25" },
  { code: "HKMU", since: "03-Jul-23" },
  { code: "HOME", since: "03-Feb-20" },
  { code: "HOTL", since: "01-Agu-22" },
  { code: "INAF", since: "02-Jul-24" },
  { code: "IIKP", since: "16-Feb-24" },
  { code: "INRU", since: "17-Des-25" },
  { code: "IPPE", since: "06-Sep-24" },
  { code: "JSKY", since: "01-Agu-22" },
  { code: "KAYU", since: "18-Apr-24" },
  { code: "KBRI", since: "23-Apr-19" },
  { code: "KIAS", since: "01-Agu-25" },
  { code: "LMSH", since: "31-Jan-25" },
  { code: "MAGP", since: "18-Jul-22" },
  { code: "MENN", since: "29-Okt-25" },
  { code: "MFMI", since: "31-Jan-25" },
  { code: "MKNT", since: "02-Jul-24" },
  { code: "MTPS", since: "05-Nov-25" },
  { code: "MTSM", since: "31-Jan-25" },
  { code: "NUSA", since: "31-Agu-20" },
  { code: "PLIN", since: "31-Jan-25" },
  { code: "PMMP", since: "30-Jun-25" },
  { code: "POLL", since: "02-Jul-24" },
  { code: "POOL", since: "10-Jun-20" },
  { code: "POSA", since: "24-Nov-20" },
  { code: "PTMR", since: "26-Jun-25" },
  { code: "PURE", since: "01-Agu-22" },
  { code: "RIMO", since: "11-Feb-20" },
  { code: "SIMA", since: "17-Feb-20" },
  { code: "SMCB", since: "31-Jan-25" },
  { code: "SMRU", since: "23-Jan-20" },
  { code: "SWAT", since: "30-Jun-25" },
  { code: "TECH", since: "07-Agu-23" },
  { code: "TGRA", since: "23-Jun-25" },
  { code: "TGUK", since: "26-Mei-25" },
  { code: "TOPS", since: "06-Nov-25" },
  { code: "TRAM", since: "23-Jan-20" },
  { code: "TRIO", since: "17-Jul-19" },
  { code: "WICO", since: "31-Jan-25" },
  { code: "WIKA", since: "18-Feb-25" },
  { code: "WSKT", since: "08-Mei-23" },
  { code: "ZBRA", since: "30-Jun-25" },
];

const archived = new Set(SUSPENSION_ARCHIVE.map((row) => row.code));

/** Historical reference ONLY. This is never a confirmed *current* status. */
export function wasInSuspensionArchive(code: string): boolean {
  return archived.has(code.toUpperCase());
}
