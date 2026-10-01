"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignOutButton({ english = false }: { english?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function signOut() {
    setBusy(true);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("Gagal keluar");
      router.replace("/login");
      router.refresh();
    } catch {
      setBusy(false);
    }
  }
  return <button type="button" onClick={signOut} disabled={busy} className="border border-down/60 px-3 py-2 text-xs font-semibold text-down hover:bg-down/10 disabled:opacity-50">{busy ? (english ? "Processing…" : "Memproses…") : (english ? "Sign out" : "Keluar dari akun")}</button>;
}
