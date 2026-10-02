import "server-only";
import { getCompanyCatalogEntry } from "@/lib/company-catalog";
import { OWNERSHIP_SOURCE, codesForNamedShareholder, shareholdersFor } from "@/lib/shareholders";

export const FORBES_LIST_URL = "https://www.forbes.com/lists/indonesia-billionaires/?view=pc";
export const FORBES_LIST_DATE = "10 Desember 2025";

export type KongloProfile = {
  slug: string;
  rank?: number;
  name: string;
  /** Forbes 2025 USD estimate; family figures belong to the family. */
  netWorthUsd?: number;
  wealthNote?: string;
  holderName?: string;
  candidateCodes: readonly string[];
  reportedDirect?: readonly { code: string; percentage: number; ownershipAsOf: string; sourceUrl: string }[];
  groupExposure?: readonly { code: string; sourceUrl: string; percentage?: number; shares?: number; ownershipAsOf?: string; holder?: string; holderNames?: readonly string[]; stakeMultiplier?: number }[];
  pendingExposure?: readonly { code: string; holder: string; percentage: number; sourceUrl: string; announcedOn: string; note: string }[];
};

const HAJI_SOURCE = "https://market.bisnis.com/read/20260921/192/2005815/deretan-portofolio-bisnis-haji-isam-dari-sawit-pertambangan-hingga-transportasi";
const BAKRIE_SOURCE = "https://bakrie-brothers.com/wp-content/uploads/2026/04/BNBR-Integrated-Annual-Report-2025.pdf";
const OWNERSHIP_DATE = "27 Februari 2026";

/** Forbes wealth and KSEI direct ownership have different dates and scopes. */
const CURATED_PROFILES: readonly KongloProfile[] = [
  { slug: "hartono", rank: 1, name: "Keluarga Hartono", netWorthUsd: 43.8e9, wealthNote: "Forbes 2025 menilai Budi & Michael Hartono bersama; angka historis ini bukan valuasi saham grup saat ini.", candidateCodes: [], groupExposure: [
    { code: "BBCA", holderNames: ["PT DWIMURIA INVESTAMA ANDALAN"], holder: "PT Dwimuria Investama Andalan", sourceUrl: "https://www.bca.co.id/id/tentang-bca/hubungan-investor/informasi-saham/komposisi-pemegang-saham" },
    { code: "BELI", holderNames: ["PT GLOBAL INVESTAMA ANDALAN"], holder: "PT Global Investama Andalan", sourceUrl: "https://about.blibli.com/investor-relations/prospectus/Preliminary%20Prospectus%20IPO%20-%20PT%20Global%20Digital%20Niaga%20Tbk.pdf" },
  ] },
  { slug: "widjaja-family", rank: 3, name: "Keluarga Widjaja", netWorthUsd: 28.3e9, candidateCodes: [], groupExposure: [
    { code: "DSSA", holderNames: ["PT SINAR MAS TUNGGAL"], holder: "PT Sinar Mas Tunggal", sourceUrl: "https://dssa.co.id/documents/Annual_Report_DSSA_2025.pdf" },
    { code: "SMMA", holderNames: ["SINAR MAS CAKRAWALA"], holder: "Sinar Mas Cakrawala", sourceUrl: "https://sinarmas.com/en/financial-services.html" },
    { code: "BSIM", holderNames: ["PT SINAR MAS MULTIARTHA Tbk"], holder: "PT Sinar Mas Multiartha", sourceUrl: "https://sinarmas.com/en/financial-services.html" },
    { code: "INKP", holderNames: ["APP PURINUSA EKAPERSADA", "PT APP PURINUSA EKAPERSADA"], holder: "APP Purinusa Ekapersada", sourceUrl: "https://www.sinarmas.com/pulp-and-paper.html" },
    { code: "TKIM", holderNames: ["APP PURINUSA EKAPERSADA"], holder: "APP Purinusa Ekapersada", sourceUrl: "https://www.sinarmas.com/pulp-and-paper.html" },
    { code: "BSDE", holderNames: ["PARAGA ARTAMIDA, PT", "PT EKACENTRA USAHAMAJU"], holder: "PT Paraga Artamida + PT Ekacentra Usahamaju", sourceUrl: "https://www.sinarmasland.com/about-us/history-bumi-serpong-damai" },
    { code: "DUTI", holderNames: ["BUMI SERPONG DAMAI TBK PT"], holder: "PT Bumi Serpong Damai Tbk", sourceUrl: "https://www.sinarmasland.com/about-us/history-bumi-serpong-damai" },
  ] },
  { slug: "prajogo-pangestu", rank: 2, name: "Prajogo Pangestu", netWorthUsd: 39.8e9, holderName: "PRAJOGO PANGESTU", candidateCodes: ["BRPT", "TPIA", "CUAN"], groupExposure: [
    { code: "BREN", holderNames: ["PT Barito Pacific Tbk"], holder: "PT Barito Pacific Tbk", sourceUrl: "https://www.barito-pacific.com/uploads/investors/annual-report-260513100241BRPT%20-%20AR%202025%20-%20260513_compressed.pdf" },
    { code: "TPIA", holderNames: ["BARITO PACIFIC TBK"], holder: "PT Barito Pacific Tbk", sourceUrl: "https://barito-pacific.com/newsroom/pt-barito-pacific-tbk-idx-brpt-announces-its-audited-consolidated-performance-for-the-full-year-of-2025" },
    { code: "CDIA", holderNames: ["PT CHANDRA ASRI PACIFIC TBK"], holder: "PT Chandra Asri Pacific Tbk", sourceUrl: "https://www.barito-pacific.com/uploads/investors/annual-report-260513100241BRPT%20-%20AR%202025%20-%20260513_compressed.pdf" },
    { code: "PTRO", holderNames: ["PT. KREASI JASA PERSADA", "PT PETRINDO JAYA KREASI TBK"], holder: "PT Kreasi Jasa Persada + PT Petrindo Jaya Kreasi Tbk", sourceUrl: "https://www.petrindo.co.id/wp-content/uploads/2026/04/30April2026_CUAN_Annual-Report-2025.pdf" },
  ] },
  { slug: "franky-widjaja", name: "Franky Oesman Widjaja", wealthNote: "Forbes menilai keluarga Widjaja US$28,3 miliar; angka itu bukan kekayaan pribadi Franky.", holderName: "FRANKY OESMAN WIDJAJA", candidateCodes: ["BOLA"], groupExposure: [{ code: "DSSA", percentage: 59.9, shares: 4615523200, ownershipAsOf: "31 Desember 2025", holder: "PT Sinar Mas Tunggal · deemed interest Franky", sourceUrl: "https://dssa.co.id/documents/Annual_Report_DSSA_2025.pdf" }] },
  { slug: "low-tuck-kwong", rank: 4, name: "Low Tuck Kwong", netWorthUsd: 24.9e9, holderName: "LOW TUCK KWONG", candidateCodes: ["BYAN", "MYOH", "MAHA"] },
  { slug: "anthoni-salim", rank: 5, name: "Anthoni (Antony) Salim & keluarga", netWorthUsd: 13.6e9, holderName: "ANTHONI SALIM", candidateCodes: ["DNET", "EMTK", "DCII", "BBCA"], groupExposure: [
    { code: "INDF", holderNames: ["FIRST PACIFIC INVESTMENT MANAGEMENT LTD"], holder: "First Pacific Investment Management Ltd", sourceUrl: "https://www.indofood.com/page/shareholders-composition" },
    { code: "ICBP", holderNames: ["INDOFOOD SUKSES MAKMUR TBK"], holder: "PT Indofood Sukses Makmur Tbk", sourceUrl: "https://www.indofood.com/page/company-group-structure" },
    { code: "SIMP", holderNames: ["INDOFOOD AGRI RESOURCES LTD.", "INDOFOOD SUKSES MAKMUR TBK"], holder: "Indofood Agri Resources + PT Indofood Sukses Makmur", sourceUrl: "https://www.indofood.com/page/company-group-structure" },
    { code: "LSIP", holderNames: ["PT SALIM IVOMAS PRATAMA TBK"], holder: "PT Salim Ivomas Pratama Tbk", sourceUrl: "https://www.indofood.com/page/company-group-structure" },
  ] },
  { slug: "otto-toto-sugiri", rank: 6, name: "Otto Toto Sugiri", netWorthUsd: 11.3e9, holderName: "OTTO TOTO SUGIRI", candidateCodes: ["DCII"] },
  { slug: "tahir", rank: 7, name: "Tahir & keluarga", netWorthUsd: 9.8e9, holderName: "TAHIR", candidateCodes: ["MAYA", "SONA", "MPRO"] },
  { slug: "marina-budiman", rank: 8, name: "Marina Budiman", netWorthUsd: 8.2e9, holderName: "MARINA BUDIMAN", candidateCodes: ["DCII"] },
  { slug: "dewi-kam", rank: 17, name: "Dewi Kam", netWorthUsd: 4.3e9, candidateCodes: [], groupExposure: [{ code: "BYAN", sourceUrl: "https://www.forbes.com/profile/dewi-kam/" }] },
  { slug: "garibaldi-thohir", rank: 19, name: "Garibaldi Thohir & keluarga", netWorthUsd: 3.8e9, holderName: "GARIBALDI THOHIR", candidateCodes: ["MBMA", "ADRO", "TRIM", "AADI", "ESSA", "PALM", "MDKA"] },
  { slug: "edwin-soeryadjaya", rank: 45, name: "Edwin Soeryadjaya & keluarga", netWorthUsd: 1.2e9, holderName: "EDWIN SOERYADJAYA", candidateCodes: ["MBMA", "ADRO", "SRTG", "AADI"] },
  { slug: "hary-tanoesoedibjo", rank: 48, name: "Hary Tanoesoedibjo", netWorthUsd: 1e9, holderName: "HARY TANOESOEDIBJO", candidateCodes: ["BHIT"], groupExposure: [
    { code: "BMTR", holderNames: ["PT. MNC ASIA HOLDING TBK"], holder: "PT MNC Asia Holding Tbk", sourceUrl: "https://www.mncland.com/storage/app/uploads/public/66a/c5d/2b6/66ac5d2b691c4746826619.pdf" },
    { code: "MNCN", holderNames: ["PT GLOBAL MEDIACOM TBK", "PT. MNC ASIA HOLDING TBK"], holder: "PT Global Mediacom + PT MNC Asia Holding", sourceUrl: "https://www.mncland.com/storage/app/uploads/public/66a/c5d/2b6/66ac5d2b691c4746826619.pdf" },
    { code: "KPIG", holderNames: ["PT. MNC ASIA HOLDING TBK"], holder: "PT MNC Asia Holding Tbk", sourceUrl: "https://www.mncland.com/storage/app/uploads/public/60b/8e1/385/60b8e1385d8b9612017326.pdf" },
    { code: "MSIN", holderNames: ["PT GLOBAL MEDIACOM TBK"], holder: "PT Global Mediacom Tbk", sourceUrl: "https://www.mncland.com/storage/app/uploads/public/66a/c5d/2b6/66ac5d2b691c4746826619.pdf" },
    { code: "BCAP", holderNames: ["PT. MNC ASIA HOLDING TBK"], holder: "PT MNC Asia Holding Tbk", sourceUrl: "https://www.mncland.com/storage/app/uploads/public/66a/c5d/2b6/66ac5d2b691c4746826619.pdf" },
    { code: "BABP", holderNames: ["PT MNC KAPITAL INDONESIA TBK"], holder: "PT MNC Kapital Indonesia Tbk", sourceUrl: "https://www.mncland.com/storage/app/uploads/public/66a/c5d/2b6/66ac5d2b691c4746826619.pdf" },
  ] },
  { slug: "haji-isam", name: "Haji Isam (Samsudin Andi Arsyad)", candidateCodes: [], reportedDirect: [
    { code: "PACK", percentage: 20.05, ownershipAsOf: "18 September 2026", sourceUrl: HAJI_SOURCE },
    { code: "RANS", percentage: 1.4, ownershipAsOf: "31 Agustus 2026", sourceUrl: HAJI_SOURCE },
  ], groupExposure: [
    { code: "JARR", holderNames: ["ESHAN AGRO SENTOSA PT"], holder: "PT Eshan Agro Sentosa · Jhonlin Group", sourceUrl: "https://www.idxchannel.com/playlists/siapa-pemilik-saham-jarr-punya-konglomerat-kalsel-intip-info-kepemilikannya" },
    { code: "PGUN", holderNames: ["PT ARAYA AGRO LESTARI", "PT CITRA AGRO RAYA"], holder: "PT Araya Agro Lestari + PT Citra Agro Raya · anak Haji Isam", sourceUrl: HAJI_SOURCE },
    { code: "TEBE", holderNames: ["PT. DUA SAMUDERA PERKASA"], holder: "PT Dua Samudera Perkasa · Jhonlin Group", sourceUrl: "https://www.idxchannel.com/playlists/keluarga-haji-isam-perluas-sayap-dari-tambang-ke-bisnis-kfc" },
  ], pendingExposure: [{ code: "BYAN", holder: "PT Jhonlin Baratama", percentage: 30, announcedOn: "16 September 2026", sourceUrl: "https://market.bisnis.com/read/20260927/192/2007518/haji-isam-akuisisi-30-saham-bayan-byan-low-tuck-kwong-tetap-pengendali", note: "Perjanjian jual beli bersyarat; penyelesaian dan perpindahan saham belum dikonfirmasi." }] },
  { slug: "tanoko-family", rank: 9, name: "Wijono & Hermanto Tanoko & keluarga", netWorthUsd: 8.1e9, candidateCodes: [], groupExposure: [
    { code: "AVIA", holderNames: ["PT TANCORP SURYA SENTOSA", "PT WAHANA LANCAR REJEKI"], holder: "PT Tancorp Surya Sentosa + PT Wahana Lancar Rejeki", sourceUrl: "https://avianbrands.com/tentang-kami/managemen/hermanto-tanoko" },
  ] },
  { slug: "happy-hapsoro", name: "Happy Hapsoro", holderName: "HAPSORO", candidateCodes: ["RAJA", "MINA", "SINI", "UANG", "ARKO"] },
  { slug: "bakrie", name: "Keluarga Bakrie", candidateCodes: [], groupExposure: [
    { code: "BNBR", sourceUrl: BAKRIE_SOURCE },
    { code: "VKTR", holderNames: ["BAKRIE & BROTHERS TBK, PT", "Bakrie Metal Industries, PT"], holder: "BNBR + PT Bakrie Metal Industries", sourceUrl: BAKRIE_SOURCE },
    { code: "VIVA", holderNames: ["PT. Bakrie Global Ventura"], holder: "PT Bakrie Global Ventura", sourceUrl: BAKRIE_SOURCE },
    { code: "BUMI", holderNames: ["PT BAKRIE CAPITAL INDONESIA"], holder: "PT Bakrie Capital Indonesia", sourceUrl: BAKRIE_SOURCE },
    { code: "UNSP", holderNames: ["PT BAKRIE CAPITAL INDONESIA"], holder: "PT Bakrie Capital Indonesia", sourceUrl: BAKRIE_SOURCE },
    { code: "ENRG", holderNames: ["PT BAKRIE CAPITAL INDONESIA", "PT BAKRIE KALILA INVESTMENT"], holder: "PT Bakrie Capital Indonesia + PT Bakrie Kalila Investment", sourceUrl: BAKRIE_SOURCE },
  ] },
  { slug: "hashim-djojohadikusumo", name: "Hashim Djojohadikusumo", candidateCodes: [], groupExposure: [
    { code: "COIN", sourceUrl: "https://market.bisnis.com/read/20251217/192/1937426/investasi-baru-arsari-group-milik-hashim-coin-hingga-blok-migas-natuna" },
    { code: "WIFI", holderNames: ["PT. INVESTASI SUKSES BERSAMA"], stakeMultiplier: 0.45, holder: "PT Arsari Sentra Data 45% × PT Investasi Sukses Bersama", sourceUrl: "https://legacy.pasardana.id/news/2025/1/10/pt-arsari-sentra-data-miliki-22-55-wifi-secara-tidak-langsung-melalui-kepemilikan-45-00-pt-investasi-sukses-bersama/" },
  ] },
];

/** Forbes Indonesia's 50 Richest, published 10 December 2025. USD figures are dated estimates. */
const FORBES_2025 = [
  [1, "R. Budi & Michael Hartono", 43.8], [2, "Prajogo Pangestu", 39.8],
  [3, "Widjaja family", 28.3], [4, "Low Tuck Kwong", 24.9],
  [5, "Anthoni Salim & family", 13.6], [6, "Otto Toto Sugiri", 11.3],
  [7, "Tahir & family", 9.8], [8, "Marina Budiman", 8.2],
  [9, "Wijono & Hermanto Tanoko & family", 8.1], [10, "Sri Prakash Lohia", 8],
  [11, "Haryanto Tjiptodihardjo", 6.2], [12, "Han Arming Hanafia", 5.3],
  [13, "Agoes Projosasmito", 5], [14, "Lim Hariyanto Wijaya Sarwono", 4.9],
  [15, "Theodore Rachmat", 4.45], [16, "Chairul Tanjung", 4.4],
  [17, "Dewi Kam", 4.3], [18, "Bachtiar Karim & family", 4.2],
  [19, "Garibaldi Thohir & family", 3.8], [20, "Mochtar Riady & family", 3.75],
  [21, "Sukanto Tanoto", 3.7], [22, "Setiawan family", 3.6],
  [23, "Martua Sitorus", 3.55], [24, "Jogi Hendra Atmadja & family", 3.5],
  [25, "Susilo Wonowidjojo & family", 3.2], [26, "Peter Sondakh", 3.1],
  [27, "Ciliandra Fangiono & family", 3.05], [28, "Hilmi Panigoro & family", 2.9],
  [29, "Sjamsul Nursalim & family", 2.8], [30, "Djoko Susanto", 2.7],
  [31, "Manoj Punjabi", 2.6], [32, "Putera Sampoerna & family", 2.5],
  [33, "Arini Subianto & family", 2.4], [34, "Bambang Sutantio", 2.35],
  [35, "Alexander Ramlie", 2.3], [36, "Eddy Kusnadi Sariaatmadja & family", 1.8],
  [37, "Hamami family", 1.7], [38, "Ciputra family", 1.6],
  [39, "Husodo Angkosubroto & family", 1.5], [40, "Sulistyo family", 1.45],
  [41, "Jenny Quantero & Engki Wibowo", 1.4], [42, "Soegiarto Adikoesoemo", 1.35],
  [43, "Lim Chai Hock", 1.3], [44, "Hartati Murdaya", 1.25],
  [45, "Edwin Soeryadjaya & family", 1.2], [46, "Irwan Hidayat & family", 1.15],
  [47, "Eddy Sugianto", 1.1], [48, "Hary Tanoesoedibjo", 1],
  [49, "Eddy Katuari & family", 0.995], [50, "Husain Djojonegoro & family", 0.92],
] as const;

const curatedByRank = new Map(CURATED_PROFILES.filter((profile) => profile.rank).map((profile) => [profile.rank, profile]));
export const KONGLO_PROFILES: readonly KongloProfile[] = [
  ...FORBES_2025.map(([rank, name, usdBillions]): KongloProfile => curatedByRank.get(rank) ?? {
    slug: name.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-").replaceAll(/^-|-$/g, ""),
    rank, name, netWorthUsd: usdBillions * 1e9,
    holderName: !name.includes("&") && !name.toLowerCase().includes("family") ? name.toUpperCase() : undefined,
    candidateCodes: [],
  }),
  ...CURATED_PROFILES.filter((profile) => !profile.rank),
];

export type KongloHolding = {
  code: string;
  name: string;
  percentage: number | null;
  ownershipAsOf: string | null;
  shares: number | null;
  price: number | null;
  priceAsOf: string | null;
  marketCap: number | null;
  indicativeValue: number | null;
  kind: "direct" | "group";
  holder: string;
  sourceUrl: string;
  snapshotSourceUrl?: string;
};

function valueFromMarketCap(percentage: number | null, marketCap: number | null) {
  return percentage !== null && marketCap !== null && marketCap > 0 ? percentage / 100 * marketCap : null;
}

export function kongloHoldings(profile: KongloProfile): KongloHolding[] {
  const directCodes = profile.holderName ? [...new Set([...profile.candidateCodes, ...codesForNamedShareholder(profile.holderName)])] : [];
  const direct: KongloHolding[] = directCodes.flatMap((code) => {
    const holder = shareholdersFor(code).find((row) => row.name.toUpperCase() === profile.holderName);
    const company = getCompanyCatalogEntry(code);
    if (!holder || !company) return [];
    const price = company.closingPrice && company.closingPrice > 0 ? company.closingPrice : null;
    return [{ code, name: company.name, percentage: holder.percentage, ownershipAsOf: OWNERSHIP_DATE, shares: holder.shares, price,
      priceAsOf: price ? company.holdingsDate : null, marketCap: company.marketCap, indicativeValue: valueFromMarketCap(holder.percentage, company.marketCap),
      kind: "direct", holder: holder.name, sourceUrl: OWNERSHIP_SOURCE }];
  });
  const reported: KongloHolding[] = (profile.reportedDirect ?? []).flatMap((item) => {
    const company = getCompanyCatalogEntry(item.code);
    return company ? [{ code: item.code, name: company.name, percentage: item.percentage,
      ownershipAsOf: item.ownershipAsOf, shares: null, price: null, priceAsOf: null, marketCap: company.marketCap,
      indicativeValue: valueFromMarketCap(item.percentage, company.marketCap), kind: "direct", holder: profile.name, sourceUrl: item.sourceUrl }] : [];
  });
  const group: KongloHolding[] = (profile.groupExposure ?? []).flatMap(({ code, sourceUrl, percentage, shares, ownershipAsOf, holder, holderNames, stakeMultiplier }) => {
    const company = getCompanyCatalogEntry(code);
    if (!company) return [];
    const named = holderNames?.map((name) => shareholdersFor(code).find((row) => row.name.toUpperCase() === name.toUpperCase())) ?? [];
    const complete = named.length > 0 && named.every((row) => row !== undefined);
    const resolvedPercentage = complete ? named.reduce((sum, row) => sum + (row?.percentage ?? 0), 0) * (stakeMultiplier ?? 1) : percentage ?? null;
    const resolvedShares = complete ? Math.round(named.reduce((sum, row) => sum + (row?.shares ?? 0), 0) * (stakeMultiplier ?? 1)) : shares ?? null;
    return [{ code, name: company.name, percentage: resolvedPercentage, ownershipAsOf: complete ? OWNERSHIP_DATE : ownershipAsOf ?? null,
      shares: resolvedShares,
      price: null, priceAsOf: null, marketCap: company.marketCap,
      indicativeValue: valueFromMarketCap(resolvedPercentage, company.marketCap), kind: "group", holder: holder ?? "Entitas grup · porsi belum terverifikasi", sourceUrl,
      snapshotSourceUrl: complete ? OWNERSHIP_SOURCE : undefined }];
  });
  return [...direct, ...reported, ...group];
}

export function kongloPortfolioSummary(holdings: KongloHolding[]) {
  const direct = holdings.filter((item) => item.kind === "direct");
  const valued = direct.filter((item) => item.indicativeValue !== null);
  const groupValued = holdings.filter((item) => item.kind === "group" && item.indicativeValue !== null);
  return {
    directCount: direct.length,
    groupCount: holdings.length - direct.length,
    totalShares: direct.reduce((sum, item) => sum + (item.shares ?? 0), 0),
    sharesKnownCount: direct.filter((item) => item.shares !== null).length,
    indicativeValue: valued.length ? valued.reduce((sum, item) => sum + (item.indicativeValue ?? 0), 0) : null,
    valuedCount: valued.length,
    groupValue: groupValued.length ? groupValued.reduce((sum, item) => sum + (item.indicativeValue ?? 0), 0) : null,
    groupValuedCount: groupValued.length,
  };
}
