export type SectorGroup = {
  id: string;
  title: string;
  summary: string;
  sourceUrl: string;
  sourceName: string;
  tickers: readonly string[];
};

/** Curated exposure, not a claim that every issuer earns all revenue from this theme. */
export const SECTOR_GROUPS: readonly SectorGroup[] = [
  { id: "data-center", title: "Pusat Data", summary: "Operator langsung dan emiten dengan anak usaha atau proyek pusat data. Proyek rencana tidak dihitung beroperasi.", sourceName: "Riset fasilitas Lokasi Bisnis", sourceUrl: "/lokasi-bisnis", tickers: ["DCII", "TLKM", "EDGE", "ISAT"] },
  { id: "wte", title: "Energi dari Sampah (WtE)", summary: "Emiten dengan bisnis atau proyek pengolahan sampah menjadi energi. Proyek rencana tidak dihitung sebagai fasilitas beroperasi.", sourceName: "Laporan OASA dan profil TBS", sourceUrl: "https://maharaksabiru.com/berita/", tickers: ["TOBA", "OASA"] },
  { id: "coal", title: "Batu Bara", summary: "Kelompok produsen utama yang ditelusuri pada peta Lokasi Bisnis.", sourceName: "Riset aset Lokasi Bisnis", sourceUrl: "/lokasi-bisnis", tickers: ["BUMI", "AADI", "BYAN", "GEMS", "PTBA", "INDY", "ITMG", "BSSR", "UNTR", "MCOL"] },
  { id: "bank", title: "Bank", summary: "Emiten dengan klasifikasi industri bank pada katalog lokal. Urutan berdasarkan kapitalisasi pasar yang tersedia.", sourceName: "Profil perusahaan tercatat BEI", sourceUrl: "https://www.idx.co.id/id/perusahaan-tercatat/profil-perusahaan-tercatat/", tickers: [] },
];
