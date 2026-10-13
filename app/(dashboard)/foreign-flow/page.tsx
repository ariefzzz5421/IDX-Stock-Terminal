import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { Panel } from "@/components/terminal/Panel";
import { IndexExposureNetwork } from "@/components/terminal/IndexExposureNetwork";

export const metadata: Metadata = { title: "Foreign Flow — IDX Terminal" };
export const dynamic = "force-dynamic";

export default async function ForeignFlowPage() {
  await requireUser();

  return <div className="min-w-0 flex-1">
    <IndexExposureNetwork />
    <Panel title="Arus transaksi asing harian" meta="Coming soon">
      <div className="p-5 sm:p-6">
        <p className="font-display text-base font-bold text-amber">Coming soon</p>
        <p className="mt-2 max-w-2xl text-xs leading-5 text-dim">Data beli dan jual asing harian akan ditampilkan setelah sumber transaksi terhubung dan terverifikasi.</p>
      </div>
    </Panel>
  </div>;
}
