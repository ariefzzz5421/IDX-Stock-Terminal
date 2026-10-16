import type { Metadata } from "next";
import Link from "next/link";
import { BellRing, ShieldAlert } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { isResearchAdmin } from "@/lib/intelligence/access";
import { discordWebhookConfigured, getAlertDashboard } from "@/lib/alerts/store";
import { AlertConsole } from "@/components/terminal/AlertConsole";

export const metadata: Metadata = { title: "Alert Center — IDX Terminal" };
export const dynamic = "force-dynamic";

export default async function AlertPage() {
  await requireUser();
  const admin = await isResearchAdmin();
  const configured = discordWebhookConfigured();
  const snapshot = admin ? await getAlertDashboard() : null;

  return <main className="min-w-0 flex-1 bg-panel text-ink">
    <header className="border-b border-rule px-4 py-5 sm:px-6">
      <div className="flex items-center gap-2 text-amber"><BellRing className="h-5 w-5" /><span className="text-micro font-bold uppercase tracking-[0.18em]">Delivery / intelligence</span></div>
      <h1 className="mt-2 font-display text-2xl font-bold text-ink-hi">Alert Center</h1>
      <p className="mt-2 max-w-3xl text-xs leading-6 text-dim">
        Notifikasi Discord untuk riset korporasi baru dan pembaruan material. Memakai scanner KSEI dan cron yang sama seperti
        <Link href="/ai-analyst" className="ml-1 text-cyan hover:underline">AI Analyst</Link>; bukan feed harga real-time.
      </p>
    </header>
    {!admin ? <section className="m-4 max-w-3xl border border-rule bg-panel-hi p-5 sm:m-6">
      <div className="flex items-center gap-2 font-bold text-amber"><ShieldAlert className="h-4 w-4" /> Admin-only configuration</div>
      <p className="mt-3 text-sm leading-6">Masuk sebagai akun admin yang tercantum di <code>AI_ANALYST_ADMIN_USERNAMES</code> pada environment Vercel. Pengaturan, pengujian, dan delivery logs tidak ditampilkan ke pengguna biasa.</p>
      <p className="mt-3 text-xs text-dim">Scan corporate intelligence berlangsung Senin–Jumat sekitar 08.00 dan 21.00 WIB. Pengiriman hanya untuk perubahan yang cocok dengan filter.</p>
    </section> : snapshot ? <AlertConsole initial={snapshot} webhookConfigured={configured} /> : null}
  </main>;
}
