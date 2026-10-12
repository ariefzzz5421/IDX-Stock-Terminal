export type IndexConstituent = {
  code: string;
  name: string;
  sector: string;
  weightPct: number;
  capValue: number;
};

export type IndonesiaIndexSnapshot = {
  provider: "MSCI" | "FTSE Russell";
  title: string;
  snapshotDate: string;
  totalConstituents: number;
  indexMarketCap: number;
  marketCapUnit: "USD_BILLION" | "IDR_MILLION";
  topWeightPct: number;
  capLabel: string;
  sourceUrl: string;
  indexUrl: string;
  constituents: IndexConstituent[];
};

// Manually transcribed from each provider's linked, dated factsheet. Refresh
// dates deliberately stay visible: these are public index snapshots, not ticks.
export const INDONESIA_INDEX_SNAPSHOTS: IndonesiaIndexSnapshot[] = [
  {
    provider: "MSCI",
    title: "MSCI Indonesia Index",
    snapshotDate: "2026-09-30",
    totalConstituents: 9,
    indexMarketCap: 53.35581,
    marketCapUnit: "USD_BILLION",
    topWeightPct: 100,
    capLabel: "Kapitalisasi pasar free-float (USD miliar)",
    sourceUrl: "https://www.msci.com/documents/10199/255599/msci-indonesia-index.pdf",
    indexUrl: "https://www.msci.com/indexes/index/105767/msci-indonesia-index",
    constituents: [
      { code: "BBCA", name: "Bank Central Asia", sector: "Keuangan", weightPct: 31.41, capValue: 16.76 },
      { code: "BBRI", name: "Bank Rakyat Indonesia", sector: "Keuangan", weightPct: 19.96, capValue: 10.65 },
      { code: "BMRI", name: "Bank Mandiri", sector: "Keuangan", weightPct: 15.70, capValue: 8.38 },
      { code: "TLKM", name: "Telkom Indonesia", sector: "Telekomunikasi", weightPct: 10.70, capValue: 5.71 },
      { code: "ASII", name: "Astra International", sector: "Industri", weightPct: 7.81, capValue: 4.17 },
      { code: "BBNI", name: "Bank Negara Indonesia", sector: "Keuangan", weightPct: 4.64, capValue: 2.48 },
      { code: "BRMS", name: "Bumi Resources Minerals", sector: "Material", weightPct: 3.51, capValue: 1.87 },
      { code: "UNTR", name: "United Tractors", sector: "Energi", weightPct: 3.44, capValue: 1.84 },
      { code: "BRPT", name: "Barito Pacific", sector: "Material", weightPct: 2.83, capValue: 1.51 },
    ],
  },
  {
    provider: "FTSE Russell",
    title: "FTSE Indonesia Index",
    snapshotDate: "2026-05-29",
    totalConstituents: 39,
    indexMarketCap: 1_438_733_356,
    marketCapUnit: "IDR_MILLION",
    topWeightPct: 75.10,
    capLabel: "Net market cap (Rp juta)",
    sourceUrl: "https://research.ftserussell.com/Analytics/FactSheets/temp/95c623d6-3e0d-4a72-a9de-48d4c9ebaed0.pdf",
    indexUrl: "https://research.ftserussell.com/analytics/factsheets",
    constituents: [
      { code: "BBCA", name: "Bank Central Asia", sector: "Perbankan", weightPct: 19.45, capValue: 279_777_161 },
      { code: "BBRI", name: "Bank Rakyat Indonesia", sector: "Perbankan", weightPct: 13.55, capValue: 194_933_714 },
      { code: "BMRI", name: "Bank Mandiri", sector: "Perbankan", weightPct: 12.30, capValue: 176_897_213 },
      { code: "TLKM", name: "Telkom Indonesia", sector: "Telekomunikasi", weightPct: 9.17, capValue: 131_944_881 },
      { code: "ASII", name: "Astra International", sector: "Otomotif & suku cadang", weightPct: 7.01, capValue: 100_842_709 },
      { code: "BBNI", name: "Bank Negara Indonesia", sector: "Perbankan", weightPct: 3.10, capValue: 44_562_703 },
      { code: "BRPT", name: "Barito Pacific", sector: "Kimia", weightPct: 2.79, capValue: 40_210_555 },
      { code: "AMMN", name: "Amman Mineral Internasional", sector: "Pertambangan", weightPct: 2.77, capValue: 39_856_382 },
      { code: "GOTO", name: "GoTo Gojek Tokopedia", sector: "Teknologi", weightPct: 2.72, capValue: 39_128_980 },
      { code: "UNTR", name: "United Tractors", sector: "Pertambangan & industri", weightPct: 2.25, capValue: 32_381_344 },
    ],
  },
];
