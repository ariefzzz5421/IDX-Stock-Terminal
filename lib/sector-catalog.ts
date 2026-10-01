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
  { id: "data-center", title: "Data Center", summary: "Listed operators and companies with data center subsidiaries or projects. Planned capacity is kept separate from live capacity.", sourceName: "Lokasi Bisnis facility research", sourceUrl: "/lokasi-bisnis", tickers: ["DCII", "TLKM", "EDGE", "ISAT"] },
  { id: "wte", title: "Waste to Energy (WtE)", summary: "Listed companies with waste processing or energy recovery projects. A planned project is not counted as an operating facility.", sourceName: "OASA disclosures and TBS profile", sourceUrl: "https://maharaksabiru.com/berita/", tickers: ["TOBA", "OASA"] },
  { id: "coal", title: "Coal", summary: "Major producer groups tracked in Lokasi Bisnis.", sourceName: "Lokasi Bisnis asset research", sourceUrl: "/lokasi-bisnis", tickers: ["BUMI", "AADI", "BYAN", "GEMS", "PTBA", "INDY", "ITMG", "BSSR", "UNTR", "MCOL"] },
  { id: "bank", title: "Bank", summary: "BEI-listed banks in the local company catalogue, ranked by available market cap.", sourceName: "BEI listed company profiles", sourceUrl: "https://www.idx.co.id/id/perusahaan-tercatat/profil-perusahaan-tercatat/", tickers: [] },
];
