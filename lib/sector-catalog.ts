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
  { id: "data-center", title: "Data Center & Infrastructure", summary: "Issuer exposure spans operators and disclosed projects, ownership links, power and network infrastructure, industrial estates, technology suppliers, and construction contractors. Exposure is not the same as owning or operating a data center; capacity is shown only where a company source discloses it.", sourceName: "Issuer/operator disclosures and Business Indonesia review", sourceUrl: "https://market.bisnis.com/read/20261007/192/2010374/daftar-21-emiten-yang-punya-eksposur-bisnis-data-center-ada-dcii-dssa-hingga-tlkm", tickers: ["DCII", "DSSA", "TLKM", "EDGE", "INET", "MORA", "ISAT", "MGLV", "POWR", "MTEL", "TOWR", "EXCL", "MSTI", "MTDL", "DMAS", "KIJA", "BEST", "SSIA", "PTPP", "TOTL", "BNBR"] },
  { id: "wte", title: "Waste to Energy (WtE)", summary: "Listed companies with waste processing or energy recovery projects. A planned project is not counted as an operating facility.", sourceName: "OASA disclosures and TBS profile", sourceUrl: "https://maharaksabiru.com/berita/", tickers: ["TOBA", "OASA"] },
  { id: "coal", title: "Coal", summary: "Major producer groups tracked in Lokasi Bisnis.", sourceName: "Lokasi Bisnis asset research", sourceUrl: "/lokasi-bisnis", tickers: ["BUMI", "AADI", "BYAN", "GEMS", "PTBA", "INDY", "ITMG", "BSSR", "UNTR", "MCOL"] },
  { id: "bank", title: "Bank", summary: "BEI-listed banks in the local company catalogue, ranked by available market cap.", sourceName: "BEI listed company profiles", sourceUrl: "https://www.idx.co.id/id/perusahaan-tercatat/profil-perusahaan-tercatat/", tickers: [] },
];
