import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Panduan Terminal — IDX Terminal" };

const terms = [
  { name: "ARA", meaning: "Auto Rejection Atas", explanation: "Batas atas harga order harian. Order di luar batas yang ditetapkan BEI akan ditolak otomatis. Persentase berbeda menurut papan dan rentang harga; tabel di bawah berlaku 28 September–31 Desember 2026. Badge di situs hanya indikasi dari snapshot harga, bukan konfirmasi order BEI." },
  { name: "ARB", meaning: "Auto Rejection Bawah", explanation: "Batas bawah harga order harian. Pada 13 Oktober 2026, papan Utama, Pengembangan, dan Ekonomi Baru masih memakai ARB asimetris 15% untuk harga di atas Rp10; BEI menjadwalkan batas simetris mulai 1 Januari 2027. Harga acuan dan fraksi harga juga memengaruhi batas nominal. Badge di situs hanya indikasi dari snapshot harga." },
  { name: "SUSPEND", meaning: "Suspensi perdagangan", explanation: "Penghentian sementara perdagangan suatu efek oleh BEI. Status harus berasal dari pengumuman resmi yang masih berlaku; volume nol saja tidak membuktikan suspensi." },
  { name: "Free float", meaning: "Saham yang tersedia untuk publik", explanation: "Di halaman Float, persentase dihitung dari saham float dibagi saham beredar menurut vendor. Angka vendor adalah estimasi bertanggal dan dapat berbeda dari perhitungan resmi BEI." },
  { name: "Volume", meaning: "Jumlah saham berpindah tangan", explanation: "Volume dalam tabel pasar ditampilkan dalam lembar saham. Di pasar reguler BEI, satu lot umumnya berisi 100 lembar. Contoh 1 juta lembar setara 10 ribu lot." },
  { name: "Est. nilai transaksi", meaning: "Nilai perdagangan dalam rupiah", explanation: "Untuk snapshot TradingView, situs memakai Value.Traded (IDR) ketika tersedia. Pada tampilan lain yang hanya punya volume dan harga terakhir, nilai dapat berupa perkiraan volume × harga terakhir dan diberi label estimasi." },
  { name: "Papan Pemantauan Khusus", meaning: "Papan untuk efek yang memenuhi kriteria pemantauan BEI", explanation: "Mekanisme perdagangan dan batas harga dapat berbeda dari papan reguler. Keberadaan di papan ini tidak otomatis berarti efek sedang suspend." },
  { name: "Riset terverifikasi", meaning: "Analisis dengan sumber yang dapat ditelusuri", explanation: "Laporan sumber yang baru ditemukan belum tentu menjadi riset terverifikasi. Scan parsial berarti ada sumber atau dokumen yang belum berhasil diperiksa, sehingga tidak boleh disimpulkan tidak ada peristiwa." },
];

export default function PanduanPage() {
  return <main className="min-w-0 flex-1 bg-panel">
    <header className="border-b border-rule px-4 py-5 sm:px-6"><p className="text-micro font-bold uppercase tracking-widest text-amber">Terminal / istilah</p><h1 className="mt-1 font-display text-2xl font-bold text-ink-hi">Panduan</h1><p className="mt-2 text-xs text-ink">Arti istilah yang dipakai di IDX Terminal dan cara membaca datanya.</p></header>
    <div className="grid gap-px bg-rule md:grid-cols-2">{terms.map((term) => <section key={term.name} className="min-w-0 bg-panel p-4 sm:p-6"><h2 className="font-display text-sm font-bold text-amber">{term.name}</h2><p className="mt-1 text-xs font-semibold text-ink-hi">{term.meaning}</p><p className="mt-2 text-xs leading-5 text-ink">{term.explanation}</p></section>)}</div>
    <section className="border-t border-rule bg-panel p-4 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2"><h2 className="font-display text-sm font-bold uppercase tracking-wider text-amber">Batas ARA / ARB yang berlaku</h2><span className="text-micro text-dim">Efektif 28 Sep–31 Des 2026</span></div>
      <p className="mt-2 text-xs leading-5 text-ink">Angka adalah batas perubahan order terhadap harga acuan harian. Untuk harga Rp1–Rp10, batas menggunakan nominal Rp1, bukan persentase.</p>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="min-w-0 border border-rule-hi">
          <h3 className="border-b border-rule bg-panel-hi px-3 py-2 text-xs font-bold text-ink-hi">Utama · Pengembangan · Ekonomi Baru</h3>
          <table className="w-full table-fixed text-xs"><thead><tr className="text-micro uppercase tracking-wider text-dim"><th className="w-1/2 px-3 py-2 text-left font-medium">Harga acuan</th><th className="px-2 py-2 text-right font-medium">ARA</th><th className="px-3 py-2 text-right font-medium">ARB</th></tr></thead><tbody className="text-ink"><tr className="border-t border-rule"><td className="px-3 py-2">Rp1–Rp10</td><td className="px-2 py-2 text-right">Rp1</td><td className="px-3 py-2 text-right">Rp1</td></tr><tr className="border-t border-rule"><td className="px-3 py-2">&gt;Rp10–Rp200</td><td className="px-2 py-2 text-right text-up">+35%</td><td className="px-3 py-2 text-right text-down">−15%</td></tr><tr className="border-t border-rule"><td className="px-3 py-2">&gt;Rp200–Rp5.000</td><td className="px-2 py-2 text-right text-up">+25%</td><td className="px-3 py-2 text-right text-down">−15%</td></tr><tr className="border-t border-rule"><td className="px-3 py-2">&gt;Rp5.000</td><td className="px-2 py-2 text-right text-up">+20%</td><td className="px-3 py-2 text-right text-down">−15%</td></tr></tbody></table>
        </div>
        <div className="min-w-0 border border-rule-hi">
          <h3 className="border-b border-rule bg-panel-hi px-3 py-2 text-xs font-bold text-ink-hi">Akselerasi · Pemantauan Khusus</h3>
          <table className="w-full table-fixed text-xs"><thead><tr className="text-micro uppercase tracking-wider text-dim"><th className="w-1/2 px-3 py-2 text-left font-medium">Harga acuan</th><th className="px-2 py-2 text-right font-medium">ARA</th><th className="px-3 py-2 text-right font-medium">ARB</th></tr></thead><tbody className="text-ink"><tr className="border-t border-rule"><td className="px-3 py-2">Rp1–Rp10</td><td className="px-2 py-2 text-right">Rp1</td><td className="px-3 py-2 text-right">Rp1</td></tr><tr className="border-t border-rule"><td className="px-3 py-2">&gt;Rp10</td><td className="px-2 py-2 text-right text-up">+10%</td><td className="px-3 py-2 text-right text-down">−10%</td></tr></tbody></table>
        </div>
      </div>
      <p className="mt-3 text-xs leading-5 text-dim">Mulai 1 Januari 2027, BEI menjadwalkan ARB papan Utama, Pengembangan, dan Ekonomi Baru menjadi simetris dengan ARA pada tiap rentang harga. <a href="https://block.idx.id/en/products-services/trading-hours-and-mechanism/" target="_blank" rel="noopener noreferrer" className="text-cyan hover:underline">Sumber: BEI — Auto Rejection ↗</a></p>
    </section>
    <div className="flex flex-wrap gap-4 border-t border-rule p-4 text-xs sm:p-6"><Link href="/bei" className="text-cyan hover:underline">Daftar saham BEI →</Link><Link href="/free-float" className="text-cyan hover:underline">Data free float →</Link><a href="https://www.idx.co.id/id/produk/saham/" target="_blank" rel="noopener noreferrer" className="text-cyan hover:underline">Panduan saham BEI ↗</a></div>
  </main>;
}
