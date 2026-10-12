import type { Metadata } from "next";
import { ArrowDownToLine, ArrowUpFromLine, Info } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { foreignFlowLeaders } from "@/lib/foreign-flow";
import { Panel } from "@/components/terminal/Panel";
import { ForeignFlowTable } from "@/components/terminal/ForeignFlowTable";
import { IndexExposureNetwork } from "@/components/terminal/IndexExposureNetwork";

export const metadata: Metadata = { title: "Foreign Flow — IDX Terminal" };
export const dynamic = "force-dynamic";

export default async function ForeignFlowPage() {
  await requireUser();
  const flow = await foreignFlowLeaders(10);

  return <div className="min-w-0 flex-1">
    <IndexExposureNetwork flow={flow} />
    {!flow.available ? (
      <Panel title="Arus transaksi asing harian" meta="snapshot transaksi">
        <div className="max-w-2xl p-6">
          <h2 className="mb-3 text-base text-ink-hi">Data arus beli/jual asing harian belum tersedia.</h2>
          <p className="mb-5 text-sm leading-relaxed text-dim">Komposisi MSCI/FTSE di atas menunjukkan bobot dan kapitalisasi konstituen indeks. Angka itu bukan pengganti transaksi asing BEI.</p>
          <dl className="mb-5 border border-rule">
            <div className="border-b border-rule px-4 py-3"><dt className="mb-1 text-sm text-ink-hi">Ringkasan resmi BEI</dt><dd className="text-xs leading-relaxed text-dim">{flow.diagnostics.idx}</dd></div>
            <div className="px-4 py-3"><dt className="mb-1 text-sm text-ink-hi">Invezgo</dt><dd className="text-xs leading-relaxed text-dim">{flow.diagnostics.invezgo}</dd></div>
          </dl>
          <p className="text-xs leading-relaxed text-dimmer">Data ini tidak diganti dengan angka contoh. Jika kunci Invezgo perlu diperbarui, simpan sebagai <code className="text-cyan">INVEZGO_KEY</code> di environment Vercel dan redeploy.</p>
        </div>
      </Panel>
    ) : (
      <div className="flex min-h-0 flex-col gap-px">
        <div className="flex flex-wrap items-center gap-3 bg-panel-hi px-4 py-3 text-xs text-dim"><Info aria-hidden="true" className="h-4 w-4 text-amber" /><p>{flow.source === "IDX" ? "Peringkat transaksi asing bersih. Estimasi nilai = saham bersih × harga penutupan; bukan nilai resmi BEI." : "Snapshot Invezgo akhir hari. Volume bersih dan nilai transaksi mengikuti data penyedia."}</p><span className="ml-auto text-micro uppercase tracking-[0.1em] text-dimmer">{flow.date && flow.source ? `${flow.source} snapshot ${flow.date}` : "Sumber arus asing tidak tersedia"}</span></div>
        <div className="grid min-h-0 gap-px xl:grid-cols-2">
          <Panel title="Pembelian Neto Asing Terbesar" meta={<span className="inline-flex items-center gap-1 text-up"><ArrowDownToLine aria-hidden="true" className="h-3.5 w-3.5" />akumulasi</span>}><ForeignFlowTable rows={flow.topBuy} direction="buy" source={flow.source} /></Panel>
          <Panel title="Penjualan Neto Asing Terbesar" meta={<span className="inline-flex items-center gap-1 text-down"><ArrowUpFromLine aria-hidden="true" className="h-3.5 w-3.5" />distribusi</span>}><ForeignFlowTable rows={flow.topSell} direction="sell" source={flow.source} /></Panel>
        </div>
      </div>
    )}
  </div>;
}
