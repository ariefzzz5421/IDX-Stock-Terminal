import type { Metadata } from "next";
import { ArrowDownToLine, ArrowUpFromLine, Info } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { foreignFlowLeaders } from "@/lib/foreign-flow";
import { Panel } from "@/components/terminal/Panel";
import { ForeignFlowTable } from "@/components/terminal/ForeignFlowTable";

export const metadata: Metadata = { title: "Foreign Flow — IDX Terminal" };
export const dynamic = "force-dynamic";

export default async function ForeignFlowPage() {
  await requireUser();
  const flow = await foreignFlowLeaders(10);

  // Two empty tables tell you nothing. When neither source is reachable, say
  // which ones were tried and what would fix it.
  if (!flow.available) {
    return (
      <Panel title="Foreign Flow" meta="source unavailable">
        <div className="max-w-2xl p-6">
          <h2 className="mb-3 text-base text-ink-hi">Data Foreign Flow belum tersedia.</h2>
          <p className="mb-5 text-sm leading-relaxed text-dim">
            Data net buy dan net sell asing diambil dari sumber harian. Status
            kedua sumber saat permintaan ini:
          </p>

          <dl className="mb-5 border border-rule">
            <div className="border-b border-rule px-4 py-3">
              <dt className="mb-1 text-sm text-ink-hi">IDX official summary</dt>
              <dd className="text-xs leading-relaxed text-dim">
                {flow.diagnostics.idx}
              </dd>
            </div>
            <div className="px-4 py-3">
              <dt className="mb-1 text-sm text-ink-hi">Invezgo</dt>
              <dd className="text-xs leading-relaxed text-dim">
                {flow.diagnostics.invezgo}
              </dd>
            </div>
          </dl>

          <p className="text-xs leading-relaxed text-dimmer">
            Data ini tidak diganti dengan angka contoh. Jika kunci Invezgo perlu
            diperbarui, simpan sebagai <code className="text-cyan">INVEZGO_KEY</code>{" "}
            di environment Vercel dan redeploy.
          </p>
        </div>
      </Panel>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-px">
      <div className="flex flex-wrap items-center gap-3 bg-panel-hi px-4 py-3 text-xs text-dim">
        <Info aria-hidden="true" className="h-4 w-4 text-amber" />
        <p>
          {flow.source === "IDX"
            ? "Peringkat berdasarkan saham bersih asing. Estimasi nilai = saham bersih × harga penutupan; bukan nilai resmi BEI."
            : "Snapshot Invezgo akhir hari. Volume bersih dan nilai transaksi ditampilkan sesuai data penyedia."}
        </p>
        <span className="ml-auto text-micro uppercase tracking-[0.1em] text-dimmer">
          {flow.date && flow.source
            ? `${flow.source} snapshot ${flow.date}`
            : "Foreign-flow source unavailable"}
        </span>
      </div>

      <div className="grid min-h-0 flex-1 gap-px xl:grid-cols-2">
        <Panel
          title="Top Net Buy Foreign Flow"
          meta={
            <span className="inline-flex items-center gap-1 text-up">
              <ArrowDownToLine aria-hidden="true" className="h-3.5 w-3.5" />
              accumulation
            </span>
          }
        >
          <ForeignFlowTable rows={flow.topBuy} direction="buy" source={flow.source} />
        </Panel>

        <Panel
          title="Top Net Sell Foreign Flow"
          meta={
            <span className="inline-flex items-center gap-1 text-down">
              <ArrowUpFromLine aria-hidden="true" className="h-3.5 w-3.5" />
              distribution
            </span>
          }
        >
          <ForeignFlowTable rows={flow.topSell} direction="sell" source={flow.source} />
        </Panel>
      </div>
    </div>
  );
}
