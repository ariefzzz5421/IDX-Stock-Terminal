"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BellRing, CheckCircle2, ExternalLink, RotateCcw, Send, Settings2, ShieldCheck, TriangleAlert } from "lucide-react";
import type { AlertPriority } from "@/lib/alerts/rules";

type AlertSnapshot = {
  settings: { enabled: boolean; minimumPriority: string; includePreliminary: boolean; enabledAt: string };
  deliveries: Array<{
    id: string; kind: string; status: string; attempts: number; createdAt: string; sentAt: string | null;
    nextAttemptAt: string; lastError: string | null; title: string; priority: string | null; eventId: string | null;
  }>;
};

const inputClass = "border border-rule-hi bg-panel px-3 py-2 text-sm text-ink-hi outline-none focus:border-cyan";
const buttonClass = "inline-flex min-h-10 items-center justify-center gap-2 border border-rule-hi px-4 py-2 text-xs font-bold uppercase tracking-wider text-ink-hi hover:border-amber disabled:cursor-not-allowed disabled:opacity-40";
const date = (raw: string | null) => raw
  ? new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "medium", timeStyle: "short" }).format(new Date(raw)) + " WIB"
  : "—";

export function AlertConsole({ initial, webhookConfigured }: { initial: AlertSnapshot; webhookConfigured: boolean }) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initial.settings.enabled);
  const [minimumPriority, setMinimumPriority] = useState<AlertPriority>(initial.settings.minimumPriority as AlertPriority);
  const [includePreliminary, setIncludePreliminary] = useState(initial.settings.includePreliminary);
  const [busy, setBusy] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  async function request(method: "PATCH" | "POST", body: Record<string, unknown>, task: string) {
    setFeedback(null);
    setBusy(task);
    try {
      const response = await fetch("/api/alerts", {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(body),
      });
      const result = await response.json() as { ok?: boolean; error?: string; sent?: number; failed?: number };
      if (!response.ok || result.ok === false) throw new Error(result.error ?? "Request failed");
      setFeedback({ ok: true, text: task === "save" ? "Pengaturan tersimpan." : task === "test" ? "Test Discord berhasil dikirim." : "Retry dijalankan: " + (result.sent ?? 0) + " terkirim, " + (result.failed ?? 0) + " gagal." });
      router.refresh();
    } catch (error) {
      setFeedback({ ok: false, text: error instanceof Error ? error.message : "Request gagal" });
    } finally { setBusy(null); }
  }

  const counts = initial.deliveries.reduce((summary, item) => {
    if (["EVENT", "MARKET_VOLUME", "MARKET_ARA", "MARKET_ARB"].includes(item.kind)) summary[item.status] = (summary[item.status] ?? 0) + 1;
    return summary;
  }, {} as Record<string, number>);

  return <div className="grid min-w-0 gap-px bg-rule xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.55fr)]">
    <section className="min-w-0 bg-panel p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink-hi"><Settings2 className="h-5 w-5 text-amber" /> Notification settings</h2>
          <p className="mt-2 text-xs text-dim">Pengaturan global untuk channel Discord yang tercantum pada webhook environment.</p>
        </div>
        <span className={"border px-2 py-1 text-micro font-bold uppercase " + (webhookConfigured ? "border-cyan text-cyan" : "border-down text-down")}>{webhookConfigured ? "Webhook configured" : "Webhook missing"}</span>
      </div>

      <div className="mt-6 grid gap-5">
        <label className="flex cursor-pointer items-start gap-3 border border-rule bg-panel-hi p-3">
          <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} className="mt-0.5 h-4 w-4 accent-amber" />
          <span><strong className="block text-sm text-ink-hi">Enable Discord alerts</strong><span className="mt-1 block text-xs leading-5 text-dim">Matikan untuk menghentikan antrean dan pengiriman event. Aktifkan kembali untuk hanya menerima event baru setelah aktivasi.</span></span>
        </label>
        <label className="flex flex-col gap-2 text-xs font-bold uppercase tracking-wider text-ink-hi">
          Minimum materiality
          <select value={minimumPriority} onChange={(event) => setMinimumPriority(event.target.value as AlertPriority)} className={inputClass}>
            <option value="CRITICAL">CRITICAL only</option>
            <option value="HIGH">HIGH + CRITICAL (default)</option>
            <option value="MEDIUM">MEDIUM and above</option>
            <option value="WATCH">All priorities</option>
          </select>
        </label>
        <label className="flex cursor-pointer items-start gap-3 border border-rule p-3">
          <input type="checkbox" checked={includePreliminary} onChange={(event) => setIncludePreliminary(event.target.checked)} className="mt-0.5 h-4 w-4 accent-amber" />
          <span><strong className="block text-sm text-ink-hi">Include preliminary findings</strong><span className="mt-1 block text-xs leading-5 text-dim">Off by default. Jika aktif, temuan PRELIMINARY ditandai jelas; UNCONFIRMED tidak dikirim.</span></span>
        </label>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" disabled={busy !== null} onClick={() => void request("PATCH", { enabled, minimumPriority, includePreliminary }, "save")} className={buttonClass}><ShieldCheck className="h-4 w-4" /> Save settings</button>
        <button type="button" disabled={busy !== null || !webhookConfigured} onClick={() => void request("POST", { action: "test" }, "test")} className={buttonClass}><Send className="h-4 w-4" /> Test Discord Alert</button>
        <button type="button" disabled={busy !== null || !webhookConfigured || !initial.settings.enabled} onClick={() => void request("POST", { action: "retry" }, "retry")} className={buttonClass}><RotateCcw className="h-4 w-4" /> Retry failed</button>
      </div>
      {feedback && <p role="status" className={"mt-4 flex items-center gap-2 border px-3 py-2 text-xs " + (feedback.ok ? "border-cyan text-cyan" : "border-down text-down")}>{feedback.ok ? <CheckCircle2 className="h-4 w-4" /> : <TriangleAlert className="h-4 w-4" />}{feedback.text}</p>}

    </section>

    <aside className="min-w-0 bg-panel p-4 sm:p-6">
      <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink-hi"><BellRing className="h-5 w-5 text-amber" /> Delivery history</h2>
      <p className="mt-2 text-xs text-dim">40 pengiriman terakhir.</p>
      <div className="mt-4 grid grid-cols-3 gap-px bg-rule">
        {[["Sent", counts.SENT ?? 0], ["Retry", (counts.RETRY ?? 0) + (counts.PENDING ?? 0)], ["Failed", counts.FAILED ?? 0]].map(([label, count]) =>
          <div key={String(label)} className="bg-panel-hi px-3 py-3"><div className="text-micro uppercase tracking-widest text-dim">{label}</div><div className="mt-1 font-display text-xl font-bold text-ink-hi">{count}</div></div>)}
      </div>
      <div className="mt-4 divide-y divide-rule border-y border-rule">
        {!initial.deliveries.length && <p className="py-6 text-xs text-dim">Belum ada pengiriman. Gunakan Test Discord Alert untuk menguji koneksi webhook.</p>}
        {initial.deliveries.map((item) => <article key={item.id} className="min-w-0 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className={"text-micro font-bold tracking-widest " + (item.status === "SENT" ? "text-cyan" : item.status === "FAILED" ? "text-down" : "text-amber")}>{item.status} · {item.kind}</span>
            <time className="text-micro text-dim">{date(item.createdAt)}</time>
          </div>
          <p className="mt-1 break-words text-xs font-semibold leading-5 text-ink-hi">{item.title}</p>
          <p className="mt-1 text-micro text-dim">Attempts: {item.attempts}{item.priority ? " · " + item.priority : ""} {item.sentAt ? " · sent " + date(item.sentAt) : ""}</p>
          {item.lastError && <p className="mt-1 break-words text-micro text-down">{item.lastError}</p>}
          {item.status === "RETRY" && <p className="mt-1 text-micro text-amber">Next eligible retry: {date(item.nextAttemptAt)} (checked during next delivery pass)</p>}
          {item.eventId && <a href={"/ai-analyst/research/" + encodeURIComponent(item.eventId)} className="mt-2 inline-flex items-center gap-1 text-micro text-cyan hover:underline">Open research <ExternalLink className="h-3 w-3" /></a>}
        </article>)}
      </div>
    </aside>
  </div>;
}
