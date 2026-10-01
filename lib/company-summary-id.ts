import { formatValue } from "@/lib/format";

const SECTORS: Record<string, string> = {
  "basic materials": "bahan baku",
  "coal mining": "pertambangan batu bara",
  "communications": "komunikasi",
  "consumer cyclicals": "barang konsumen siklikal",
  "consumer non-cyclicals": "barang konsumen primer",
  "energy": "energi",
  "energy minerals": "mineral energi",
  "finance": "keuangan",
  "financials": "keuangan",
  "healthcare": "kesehatan",
  "health services": "layanan kesehatan",
  "industrials": "industri",
  "infrastructures": "infrastruktur",
  "metal and mineral mining": "pertambangan logam dan mineral",
  "plantation": "perkebunan",
  "properties & real estate": "properti dan real estat",
  "property and real estate": "properti dan real estat",
  "technology": "teknologi",
  "technology services": "layanan teknologi",
  "telecomunication": "telekomunikasi",
  "transportation": "transportasi",
  "transportation & logistic": "transportasi dan logistik",
  "utilities": "utilitas",
};

/** A source-bounded Indonesian overview for every listed stock, including when source prose is English. */
export function companySummaryId({ name, code, sector, marketCap }: { name: string; code: string; sector: string | null; marketCap: number | null }) {
  const translatedSector = sector ? SECTORS[sector.toLowerCase()] : null;
  return `${name} (${code}) adalah perusahaan tercatat di Bursa Efek Indonesia.${translatedSector ? ` Klasifikasi sektornya adalah ${translatedSector}.` : ""}${marketCap != null ? ` Kapitalisasi pasar yang tersedia pada terminal ini adalah ${formatValue(marketCap)}.` : " Kapitalisasi pasar belum tersedia pada terminal ini."} Rincian kegiatan usaha dari sumber ditampilkan di bawah jika tersedia; angka pasar dapat tertunda.`;
}
