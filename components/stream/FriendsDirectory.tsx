"use client";

import Link from "next/link";
import { useState } from "react";
import { UserPlus, UserCheck, UserX, Check, Search } from "lucide-react";
import { StreamAvatar } from "./StreamAvatar";

export type FriendRow = { username: string; displayName: string | null; avatarUrl: string | null; state: "none" | "outgoing" | "incoming" | "friends" };
type Page = { users: FriendRow[]; nextCursor: string | null };

export function FriendAction({ username, initialState, canManage }: { username: string; initialState: FriendRow["state"]; canManage: boolean }) {
  const [state, setState] = useState(initialState);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function act(action: "request" | "accept" | "remove" | "decline") {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/stream/friends", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, action }) });
      const result = await response.json() as { state?: FriendRow["state"]; error?: string };
      if (!response.ok) throw new Error(result.error ?? "Permintaan gagal.");
      if (result.state) setState(result.state);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Koneksi gagal."); }
    finally { setBusy(false); }
  }
  if (!canManage) return <Link href="/login" className="text-xs text-cyan">Masuk untuk berteman</Link>;
  return <div className="flex flex-wrap items-center gap-2">
    {state === "none" && <button type="button" disabled={busy} onClick={() => act("request")} className="inline-flex min-h-10 items-center gap-2 border border-amber px-3 text-xs font-bold text-amber disabled:opacity-50"><UserPlus className="h-4 w-4" /> Tambah teman</button>}
    {state === "outgoing" && <button type="button" disabled={busy} onClick={() => act("remove")} className="inline-flex min-h-10 items-center gap-2 border border-rule-hi px-3 text-xs text-ink disabled:opacity-50"><UserX className="h-4 w-4" /> Batalkan permintaan</button>}
    {state === "incoming" && <><button type="button" disabled={busy} onClick={() => act("accept")} className="inline-flex min-h-10 items-center gap-2 border border-amber px-3 text-xs font-bold text-amber disabled:opacity-50"><Check className="h-4 w-4" /> Terima</button><button type="button" disabled={busy} onClick={() => act("decline")} className="min-h-10 border border-rule-hi px-3 text-xs text-ink">Tolak</button></>}
    {state === "friends" && <button type="button" disabled={busy} onClick={() => act("remove")} className="inline-flex min-h-10 items-center gap-2 border border-rule-hi px-3 text-xs text-ink disabled:opacity-50"><UserCheck className="h-4 w-4" /> Berteman · Hapus</button>}
    {error && <span role="alert" className="text-xs text-down">{error}</span>}
  </div>;
}

export function FriendsDirectory({ initial, canManage }: { initial: Page; canManage: boolean }) {
  const [page, setPage] = useState(initial);
  const [search, setSearch] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function load(query: string, append = false) {
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams();
      if (query) params.set("search", query);
      if (append && page.nextCursor) params.set("cursor", page.nextCursor);
      const response = await fetch(`/api/stream/friends?${params}`);
      if (!response.ok) throw new Error("Daftar akun belum dapat dimuat.");
      const result = await response.json() as Page;
      setPage(append ? { users: [...page.users, ...result.users], nextCursor: result.nextCursor } : result);
      if (!append) setAppliedQuery(query);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Koneksi gagal."); }
    finally { setLoading(false); }
  }
  return <div className="space-y-3">
    <form onSubmit={(event) => { event.preventDefault(); void load(search.trim()); }} className="flex gap-2"><label className="min-w-0 flex-1"><span className="sr-only">Cari teman atau akun</span><input value={search} onChange={(event) => setSearch(event.target.value)} maxLength={40} placeholder="Cari username atau nama" className="min-h-11 w-full border border-rule-hi bg-panel px-3 text-sm text-ink-hi outline-none focus:border-amber" /></label><button type="submit" disabled={loading} aria-label="Cari akun" className="grid min-h-11 min-w-11 place-items-center border border-amber text-amber disabled:opacity-50"><Search className="h-4 w-4" /></button></form>
    {page.users.length ? page.users.map((user) => <div key={user.username} className="flex min-w-0 flex-wrap items-center gap-3 border border-rule bg-panel p-3 sm:p-4"><StreamAvatar url={user.avatarUrl} name={user.displayName || user.username} /><div className="min-w-0 flex-1"><Link href={`/stream/user/${encodeURIComponent(user.username)}`} className="block truncate text-sm font-bold text-ink-hi hover:text-amber">{user.displayName || user.username}</Link><p className="truncate text-xs text-cyan">@{user.username}</p></div><FriendAction username={user.username} initialState={user.state} canManage={canManage} /></div>) : <p className="border border-rule bg-panel p-5 text-sm text-dim">Belum ada akun yang cocok.</p>}
    {page.nextCursor && <button type="button" disabled={loading} onClick={() => void load(appliedQuery, true)} className="min-h-11 w-full border border-rule-hi text-xs text-cyan disabled:opacity-50">{loading ? "Memuat…" : "Muat akun berikutnya"}</button>}
    {error && <p role="alert" className="text-xs text-down">{error}</p>}
  </div>;
}
