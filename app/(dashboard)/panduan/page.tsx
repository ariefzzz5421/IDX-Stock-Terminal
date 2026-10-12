import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Panduan Terminal — IDX Terminal" };

const terms = [
  { name: "ARA", meaning: "Auto Rejection Atas", explanation: "Batas kenaikan harga untuk suatu order pada sesi perdagangan. Persentase dan fraksi harga mengikuti aturan BEI dan jenis papan yang berlaku. Badge indikasi ARA pada situs memakai harga snapshot, sehingga cek kembali order book atau pengumuman BEI untuk status resmi." },
  { name: "ARB", meaning: "Auto Rejection Bawah", explanation: "Batas penurunan harga untuk suatu order pada sesi perdagangan. Angka persisnya dapat berubah menurut papan, harga acuan, dan aturan BEI. Badge indikasi ARB bukan bukti order ditolak BEI." },
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
    <div className="flex flex-wrap gap-4 border-t border-rule p-4 text-xs sm:p-6"><Link href="/bei" className="text-cyan hover:underline">Daftar saham BEI →</Link><Link href="/free-float" className="text-cyan hover:underline">Data free float →</Link><a href="https://www.idx.co.id/id/produk/saham/" target="_blank" rel="noopener noreferrer" className="text-cyan hover:underline">Panduan saham BEI ↗</a></div>
  </main>;
}
