export type IndexResearch = {
  slug: string;
  provider: "MSCI" | "FTSE Russell";
  publishedAt: string; // YYYY-MM when the publisher discloses only a month
  title: string;
  kind: "Factsheet" | "Riset" | "Pengumuman indeks";
  sourceUrl: string;
  relatedSourceUrl?: string;
  summary: string;
  findings: string[];
  relevance: string;
};

// Curated official publications relevant to Indonesia, newest first. This is
// an archive of verified items, not a claim that every provider release exists here.
export const INDEX_RESEARCH: IndexResearch[] = [
  {
    slug: "ftse-indonesia-factsheet-2026",
    provider: "FTSE Russell", publishedAt: "2026-05-29", kind: "Factsheet",
    title: "FTSE Indonesia Index dan FTSE Emerging — factsheet Mei 2026",
    sourceUrl: "https://research.ftserussell.com/Analytics/FactSheets/temp/95c623d6-3e0d-4a72-a9de-48d4c9ebaed0.pdf",
    relatedSourceUrl: "https://research.ftserussell.com/Analytics/FactSheets/temp/66e55299-fd35-4342-87f5-a3ef6b24c547.pdf",
    summary: "Factsheet FTSE Indonesia mencatat 39 konstituen dan kapitalisasi neto berdenominasi rupiah. Factsheet FTSE Emerging pada tanggal sama mencatat bobot Indonesia 0,76% dan kapitalisasi neto Indonesia US$80,511 miliar.",
    findings: ["Bobot Indonesia 0,76% adalah porsi dalam FTSE Emerging Index, bukan porsi dana ETF tertentu.", "Sepuluh saham terbesar pada bagan situs hanya sebagian dari 39 konstituen FTSE Indonesia."],
    relevance: "Menjadi dasar bobot negara, pie chart, dan estimasi dolar per saham pada halaman Foreign Flow.",
  },
  {
    slug: "msci-indonesia-free-float-2026",
    provider: "MSCI", publishedAt: "2026-04-20", kind: "Pengumuman indeks",
    title: "Pembaruan penilaian free float saham Indonesia",
    sourceUrl: "https://app2.msci.com/webapp/index_ann/DocGet?format=html&lang=en&pub_key=L%2FzT8OMvlCI%3D",
    summary: "MSCI menjelaskan penanganan sementara saham Indonesia dalam review Mei 2026 ketika menilai keterbukaan data kepemilikan dan reformasi pasar.",
    findings: ["MSCI menyatakan penambahan saham Indonesia dan kenaikan faktor inklusi asing tetap dibekukan pada review Mei 2026.", "Data pemegang saham di atas 1% dapat dipakai untuk menyesuaikan estimasi free float jika sesuai."],
    relevance: "Membantu membaca perubahan komposisi indeks; pengumuman ini bukan laporan arus pembelian asing.",
  },
  {
    slug: "msci-indonesia-factsheet-2026",
    provider: "MSCI", publishedAt: "2026-03-31", kind: "Factsheet",
    title: "MSCI Indonesia Index — factsheet Maret 2026",
    sourceUrl: "https://www.msci.com/documents/10199/255599/msci-indonesia-index.pdf",
    summary: "Factsheet historis MSCI Indonesia memuat karakteristik indeks, kapitalisasi free float, saham terbesar, serta pembagian sektor per 31 Maret 2026.",
    findings: ["Snapshot dokumen Maret 2026 memiliki 17 konstituen dan kapitalisasi indeks US$91,973 miliar.", "Tanggal ini berbeda dari data interaktif MSCI per 30 September 2026 yang ditampilkan pada grafik."],
    relevance: "Rujukan historis untuk membandingkan perubahan komposisi dan kapitalisasi indeks.",
  },
  {
    slug: "ftse-dssa-index-review-2025",
    provider: "FTSE Russell", publishedAt: "2025-08-22", kind: "Pengumuman indeks",
    title: "Perlakuan Dian Swastatika Sentosa dalam review indeks",
    sourceUrl: "https://research.ftserussell.com/products/index-notices/home/getnotice/?id=2616801",
    summary: "FTSE Russell mengumumkan rencana masuknya Dian Swastatika Sentosa ke FTSE GEIS Large Cap dengan free float yang ditentukan penerbit.",
    findings: ["Free float yang dicantumkan adalah 25,4272%.", "Penerbit meminta masukan pengguna indeks terkait kemampuan mereplikasi bobot sebelum konfirmasi akhir."],
    relevance: "Contoh bahwa bobot indeks mengikuti aturan investabilitas dan keputusan review, bukan otomatis setara saham beredar penuh.",
  },
  {
    slug: "msci-may-index-review-2024",
    provider: "MSCI", publishedAt: "2024-05-14", kind: "Pengumuman indeks",
    title: "MSCI Global Standard Indexes — review Mei 2024",
    sourceUrl: "https://app2.msci.com/webapp/index_ann/DocGet?format=html&lang=en&pub_key=PVEtLb3yBfs%3D",
    summary: "MSCI mengumumkan hasil review Mei 2024 dan perubahan yang berlaku setelah penutupan 31 Mei 2024.",
    findings: ["Chandra Asri Pacific (Indonesia) termasuk tiga penambahan terbesar MSCI Emerging Markets menurut kapitalisasi perusahaan penuh.", "Ukuran penambahan tersebut bukan jumlah uang yang dibeli investor asing."],
    relevance: "Menunjukkan bagaimana perubahan konstituen Indonesia diumumkan secara resmi.",
  },
  {
    slug: "ftse-indonesia-hidden-gem-2024",
    provider: "FTSE Russell", publishedAt: "2024-04-30", kind: "Riset",
    title: "Indonesia: a hidden gem?",
    sourceUrl: "https://www.lseg.com/en/insights/ftse-russell/indonesia-a-hidden-gem",
    summary: "Riset FTSE Russell membahas perkembangan ukuran pasar saham Indonesia dan perubahan komposisi sektornya.",
    findings: ["FTSE Indonesia Total Cap Index mencapai kapitalisasi penuh sekitar US$452 miliar pada 2023 menurut riset ini.", "Artikel membahas pertumbuhan peran saham teknologi di samping dominasi historis sektor keuangan."],
    relevance: "Kapitalisasi penuh seluruh pasar pada artikel ini tidak sebanding langsung dengan kapitalisasi neto FTSE Indonesia pada grafik.",
  },
  {
    slug: "ftse-new-economy-board-2023",
    provider: "FTSE Russell", publishedAt: "2023-01-20", kind: "Pengumuman indeks",
    title: "Papan Ekonomi Baru BEI memenuhi syarat FTSE GEIS",
    sourceUrl: "https://research.ftserussell.com/products/index-notices/home/getnotice/?id=2606875",
    summary: "FTSE Russell menerima Papan Ekonomi Baru BEI sebagai segmen pasar yang memenuhi syarat untuk dipertimbangkan dalam FTSE GEIS.",
    findings: ["Saham pada papan itu mulai dapat dipertimbangkan pada review Maret 2023, tetap mengikuti syarat kelayakan lain.", "Kelayakan segmen tidak berarti setiap saham otomatis masuk indeks."],
    relevance: "Menjelaskan perluasan cakupan potensial indeks saham Indonesia.",
  },
  {
    slug: "msci-market-accessibility-2022",
    provider: "MSCI", publishedAt: "2022-06", kind: "Riset",
    title: "MSCI Global Market Accessibility Review 2022",
    sourceUrl: "https://www.msci.com/documents/1296102/8ae816b1-fa03-bae3-0bb4-1a3b2bf387bf?t=1654804221837",
    summary: "Tinjauan akses pasar MSCI mencakup Indonesia dalam pembahasan hambatan investasi dan operasional bagi investor internasional.",
    findings: ["Dokumen menilai akses pasar, termasuk mekanisme valuta asing dan aspek operasional.", "Penilaian akses pasar bukan bobot saham atau catatan arus dana harian."],
    relevance: "Memberi konteks metodologi klasifikasi pasar berkembang.",
  },
  {
    slug: "msci-market-accessibility-2021",
    provider: "MSCI", publishedAt: "2021-06", kind: "Riset",
    title: "MSCI Global Market Accessibility Review 2021",
    sourceUrl: "https://www.msci.com/documents/1296102/1330218/MSCI_2021_Global_Market_Accessibility_Review_Report.pdf/d88d8bc0-a882-58c7-35f0-bef191e0ebe2",
    summary: "MSCI meninjau akses investor ke pasar global, termasuk status pembatasan short selling di Indonesia pada 2021.",
    findings: ["Indonesia termasuk pasar yang masih memiliki pembatasan short selling yang diperkenalkan pada 2020.", "Laporan membandingkan akses pasar 2021 terhadap tinjauan 2020."],
    relevance: "Arsip untuk memahami kondisi akses investor sebelum snapshot indeks terbaru.",
  },
  {
    slug: "msci-market-accessibility-2020",
    provider: "MSCI", publishedAt: "2020-06", kind: "Riset",
    title: "MSCI Global Market Accessibility Review 2020",
    sourceUrl: "https://www.msci.com/documents/1296102/1330218/MSCI_2020_Global_Market_Accessibility_Review_Report.pdf/78a73a91-af3d-cf21-94e8-1cc2c159d2ce",
    summary: "Tinjauan akses pasar MSCI pada tahun pandemi, termasuk dampak penghentian perdagangan dan mekanisme pasar Indonesia.",
    findings: ["MSCI mencatat Indonesia di antara pasar yang mengalami penghentian perdagangan akibat circuit breaker.", "Laporan mengulas keterbukaan kepemilikan asing, arus modal, dan kerangka operasional pasar."],
    relevance: "Titik awal arsip penelitian resmi sejak 2020.",
  },
  {
    slug: "ftse-trada-suspension-2020",
    provider: "FTSE Russell", publishedAt: "2020-02-19", kind: "Pengumuman indeks",
    title: "Perlakuan suspensi PT Trada Alam Minera",
    sourceUrl: "https://research.ftserussell.com/products/index-notices/home/getnotice?id=2595466",
    summary: "FTSE menjelaskan perlakuan konstituen saat saham Trada Alam Minera dihentikan dari perdagangan pada 2020.",
    findings: ["Saham dipertahankan sementara di indeks memakai harga perdagangan terakhir.", "FTSE menyatakan akan memantau perkembangan dan meninjau kelayakan indeksnya."],
    relevance: "Contoh historis bagaimana suspensi saham Indonesia memengaruhi perlakuan indeks.",
  },
];

export function formatResearchDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("id-ID", {
    ...(day ? { day: "numeric" as const } : {}),
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day ?? 1)));
}
