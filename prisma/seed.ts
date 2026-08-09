import "dotenv/config";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/db/generated/client";
import { CURATED_SECTORS } from "../lib/market-data/sectors";

type ListingEntry = {
  code: string;
  name: string;
  sector: string | null;
  marketCap: number | null;
  logoUrl: string | null;
};

/**
 * The full Jakarta board, produced by `npx tsx scripts/fetch-idx-listing.ts`.
 * Falls back to the curated shortlist below if the file is missing, so the
 * seed always works even without network access.
 */
function loadListing(): ListingEntry[] {
  const file = path.join(process.cwd(), "prisma", "idx-listing.json");

  if (!existsSync(file)) {
    console.warn(
      "prisma/idx-listing.json not found — seeding the curated shortlist only.\n" +
        "Run `npx tsx scripts/fetch-idx-listing.ts` for the full board.",
    );
    return IDX_STOCKS.map((s) => ({ ...s, marketCap: null, logoUrl: null }));
  }

  return JSON.parse(readFileSync(file, "utf8")) as ListingEntry[];
}

/**
 * Seed the `stocks` table with a liquid slice of the IDX universe (roughly the
 * IDX80 plus a few widely-followed names). Prices are left null on purpose —
 * the market-data adapter fills them in on the first poll.
 *
 * Sectors follow the IDX-IC classification.
 */
const IDX_STOCKS: Array<{ code: string; name: string; sector: string }> = [
  // --- Financials ----------------------------------------------------------
  { code: "BBCA", name: "Bank Central Asia Tbk.", sector: "Financials" },
  { code: "BBRI", name: "Bank Rakyat Indonesia (Persero) Tbk.", sector: "Financials" },
  { code: "BMRI", name: "Bank Mandiri (Persero) Tbk.", sector: "Financials" },
  { code: "BBNI", name: "Bank Negara Indonesia (Persero) Tbk.", sector: "Financials" },
  { code: "BBTN", name: "Bank Tabungan Negara (Persero) Tbk.", sector: "Financials" },
  { code: "BRIS", name: "Bank Syariah Indonesia Tbk.", sector: "Financials" },
  { code: "ARTO", name: "Bank Jago Tbk.", sector: "Financials" },
  { code: "BTPS", name: "Bank BTPN Syariah Tbk.", sector: "Financials" },
  { code: "BFIN", name: "BFI Finance Indonesia Tbk.", sector: "Financials" },
  { code: "SRTG", name: "Saratoga Investama Sedaya Tbk.", sector: "Financials" },
  { code: "PNLF", name: "Panin Financial Tbk.", sector: "Financials" },

  // --- Energy --------------------------------------------------------------
  { code: "ADRO", name: "Alamtri Resources Indonesia Tbk.", sector: "Energy" },
  { code: "PTBA", name: "Bukit Asam Tbk.", sector: "Energy" },
  { code: "ITMG", name: "Indo Tambangraya Megah Tbk.", sector: "Energy" },
  { code: "PGAS", name: "Perusahaan Gas Negara Tbk.", sector: "Energy" },
  { code: "MEDC", name: "Medco Energi Internasional Tbk.", sector: "Energy" },
  { code: "AKRA", name: "AKR Corporindo Tbk.", sector: "Energy" },
  { code: "BREN", name: "Barito Renewables Energy Tbk.", sector: "Energy" },
  { code: "CUAN", name: "Petrindo Jaya Kreasi Tbk.", sector: "Energy" },
  { code: "RAJA", name: "Rukun Raharja Tbk.", sector: "Energy" },
  { code: "INDY", name: "Indika Energy Tbk.", sector: "Energy" },
  { code: "HRUM", name: "Harum Energy Tbk.", sector: "Energy" },

  // --- Basic Materials -----------------------------------------------------
  { code: "ANTM", name: "Aneka Tambang Tbk.", sector: "Basic Materials" },
  { code: "INCO", name: "Vale Indonesia Tbk.", sector: "Basic Materials" },
  { code: "TINS", name: "Timah Tbk.", sector: "Basic Materials" },
  { code: "MDKA", name: "Merdeka Copper Gold Tbk.", sector: "Basic Materials" },
  { code: "AMMN", name: "Amman Mineral Internasional Tbk.", sector: "Basic Materials" },
  { code: "INTP", name: "Indocement Tunggal Prakarsa Tbk.", sector: "Basic Materials" },
  { code: "SMGR", name: "Semen Indonesia (Persero) Tbk.", sector: "Basic Materials" },
  { code: "BRPT", name: "Barito Pacific Tbk.", sector: "Basic Materials" },
  { code: "TPIA", name: "Chandra Asri Pacific Tbk.", sector: "Basic Materials" },
  { code: "ESSA", name: "Essa Industries Indonesia Tbk.", sector: "Basic Materials" },
  { code: "INKP", name: "Indah Kiat Pulp & Paper Tbk.", sector: "Basic Materials" },
  { code: "TKIM", name: "Pabrik Kertas Tjiwi Kimia Tbk.", sector: "Basic Materials" },
  { code: "NCKL", name: "Trimegah Bangun Persada Tbk.", sector: "Basic Materials" },

  // --- Consumer Non-Cyclicals ---------------------------------------------
  { code: "UNVR", name: "Unilever Indonesia Tbk.", sector: "Consumer Non-Cyclicals" },
  { code: "ICBP", name: "Indofood CBP Sukses Makmur Tbk.", sector: "Consumer Non-Cyclicals" },
  { code: "INDF", name: "Indofood Sukses Makmur Tbk.", sector: "Consumer Non-Cyclicals" },
  { code: "MYOR", name: "Mayora Indah Tbk.", sector: "Consumer Non-Cyclicals" },
  { code: "GGRM", name: "Gudang Garam Tbk.", sector: "Consumer Non-Cyclicals" },
  { code: "HMSP", name: "H.M. Sampoerna Tbk.", sector: "Consumer Non-Cyclicals" },
  { code: "AMRT", name: "Sumber Alfaria Trijaya Tbk.", sector: "Consumer Non-Cyclicals" },
  { code: "CPIN", name: "Charoen Pokphand Indonesia Tbk.", sector: "Consumer Non-Cyclicals" },
  { code: "JPFA", name: "Japfa Comfeed Indonesia Tbk.", sector: "Consumer Non-Cyclicals" },
  { code: "AALI", name: "Astra Agro Lestari Tbk.", sector: "Consumer Non-Cyclicals" },
  { code: "LSIP", name: "PP London Sumatra Indonesia Tbk.", sector: "Consumer Non-Cyclicals" },

  // --- Consumer Cyclicals --------------------------------------------------
  { code: "MAPI", name: "Mitra Adiperkasa Tbk.", sector: "Consumer Cyclicals" },
  { code: "ACES", name: "Aspirasi Hidup Indonesia Tbk.", sector: "Consumer Cyclicals" },
  { code: "ERAA", name: "Erajaya Swasembada Tbk.", sector: "Consumer Cyclicals" },
  { code: "SCMA", name: "Surya Citra Media Tbk.", sector: "Consumer Cyclicals" },
  { code: "MNCN", name: "Media Nusantara Citra Tbk.", sector: "Consumer Cyclicals" },
  { code: "MAPA", name: "Map Aktif Adiperkasa Tbk.", sector: "Consumer Cyclicals" },

  // --- Healthcare ----------------------------------------------------------
  { code: "KLBF", name: "Kalbe Farma Tbk.", sector: "Healthcare" },
  { code: "MIKA", name: "Mitra Keluarga Karyasehat Tbk.", sector: "Healthcare" },
  { code: "SIDO", name: "Industri Jamu dan Farmasi Sido Muncul Tbk.", sector: "Healthcare" },
  { code: "HEAL", name: "Medikaloka Hermina Tbk.", sector: "Healthcare" },

  // --- Industrials ---------------------------------------------------------
  { code: "ASII", name: "Astra International Tbk.", sector: "Industrials" },
  { code: "UNTR", name: "United Tractors Tbk.", sector: "Industrials" },

  // --- Technology ----------------------------------------------------------
  { code: "GOTO", name: "GoTo Gojek Tokopedia Tbk.", sector: "Technology" },
  { code: "BUKA", name: "Bukalapak.com Tbk.", sector: "Technology" },
  { code: "EMTK", name: "Elang Mahkota Teknologi Tbk.", sector: "Technology" },
  { code: "DCII", name: "DCI Indonesia Tbk.", sector: "Technology" },
  { code: "MTDL", name: "Metrodata Electronics Tbk.", sector: "Technology" },

  // --- Infrastructures -----------------------------------------------------
  { code: "TLKM", name: "Telkom Indonesia (Persero) Tbk.", sector: "Infrastructures" },
  { code: "ISAT", name: "Indosat Ooredoo Hutchison Tbk.", sector: "Infrastructures" },
  { code: "EXCL", name: "XLSmart Telecom Sejahtera Tbk.", sector: "Infrastructures" },
  { code: "TOWR", name: "Sarana Menara Nusantara Tbk.", sector: "Infrastructures" },
  { code: "TBIG", name: "Tower Bersama Infrastructure Tbk.", sector: "Infrastructures" },
  { code: "JSMR", name: "Jasa Marga (Persero) Tbk.", sector: "Infrastructures" },
  { code: "WIKA", name: "Wijaya Karya (Persero) Tbk.", sector: "Infrastructures" },
  { code: "PTPP", name: "PP (Persero) Tbk.", sector: "Infrastructures" },
  { code: "ADHI", name: "Adhi Karya (Persero) Tbk.", sector: "Infrastructures" },

  // --- Properties & Real Estate -------------------------------------------
  { code: "BSDE", name: "Bumi Serpong Damai Tbk.", sector: "Properties & Real Estate" },
  { code: "CTRA", name: "Ciputra Development Tbk.", sector: "Properties & Real Estate" },
  { code: "PWON", name: "Pakuwon Jati Tbk.", sector: "Properties & Real Estate" },
  { code: "SMRA", name: "Summarecon Agung Tbk.", sector: "Properties & Real Estate" },
  { code: "PANI", name: "Pantai Indah Kapuk Dua Tbk.", sector: "Properties & Real Estate" },
];

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const listing = loadListing();
  console.log(`Seeding ${listing.length} IDX tickers...`);

  let done = 0;

  for (const stock of listing) {
    const sector = stock.sector ?? CURATED_SECTORS[stock.code] ?? null;

    await prisma.stock.upsert({
      where: { code: stock.code },
      // Re-running the seed must not clobber prices the adapter already wrote,
      // so an existing row only gets its metadata refreshed.
      update: {
        name: stock.name,
        sector,
        marketCap: stock.marketCap,
        logoUrl: stock.logoUrl,
      },
      create: {
        code: stock.code,
        name: stock.name,
        sector,
        marketCap: stock.marketCap,
        logoUrl: stock.logoUrl,
      },
    });

    if (++done % 200 === 0) console.log(`  ${done} / ${listing.length}`);
  }

  const total = await prisma.stock.count();
  const withSector = await prisma.stock.count({ where: { NOT: { sector: null } } });
  console.log(
    `Done. stocks table holds ${total} rows (${withSector} with a sector).`,
  );
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
