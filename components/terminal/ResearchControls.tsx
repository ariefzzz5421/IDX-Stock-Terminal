"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function ResearchControls({ admin, unread }: { admin: boolean; unread: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function run(dryRun: boolean) {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/intelligence/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dryRun }) });
      const result = await response.json() as { status?: string; newEvents?: number; updatedEvents?: number; pending?: number; error?: string };
      const summary = result.status === "SUCCESS" && !dryRun && !result.newEvents && !result.updatedEvents
        ? "Tidak ada temuan material baru dari sumber KSEI yang terhubung."
        : `${result.newEvents ?? 0} baru, ${result.updatedEvents ?? 0} diperbarui, ${result.pending ?? 0} tertunda.`;
      setMessage(response.ok ? `${dryRun ? "Uji sumber" : "Riset"} ${result.status}: ${summary}` : result.error ?? `Scan ${result.status ?? "gagal"}. Periksa diagnostik sumber.`);
      router.refresh();
    } catch { setMessage("Scan gagal. Coba lagi dari panel diagnostik."); }
    finally { setBusy(false); }
  }
  async function markRead() {
    await fetch("/api/intelligence/notifications", { method: "POST" });
    router.refresh();
  }
  return <div className="flex flex-wrap items-center gap-2 text-xs">
    {unread > 0 && <button type="button" onClick={markRead} className="border border-amber px-3 py-2 text-amber hover:bg-amber/10">{unread} pembaruan baru · tandai dibaca</button>}
    {admin && <>
      <button type="button" disabled={busy} onClick={() => run(true)} className="border border-rule-hi px-3 py-2 text-ink hover:border-cyan disabled:opacity-50">Uji sumber</button>
      <button type="button" disabled={busy} onClick={() => run(false)} className="border border-amber px-3 py-2 text-amber hover:bg-amber/10 disabled:opacity-50">{busy ? "Memindai…" : "Jalankan riset"}</button>
    </>}
    {message && <span role="status" className="w-full text-cyan">{message}</span>}
  </div>;
}
