"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Camera, Heart, MessageCircle, MoreHorizontal, Pencil, Send, Share2, Trash2, X } from "lucide-react";
import type { StreamPostView } from "@/lib/stream-types";
import { StreamAvatar } from "./StreamAvatar";
import { FriendMentions, MentionText } from "./FriendMentions";

type StockOption = { code: string; name: string };

export function StreamComposer({ stocks, canPost, username, onPosted }: { stocks: StockOption[]; canPost: boolean; username: string; onPosted?: () => void }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<"status" | "thesis">("status");
  const [body, setBody] = useState("");
  const [query, setQuery] = useState("");
  const [tickers, setTickers] = useState<string[]>([]);
  const [photo, setPhoto] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const matches = query.trim() ? stocks.filter((stock) => !tickers.includes(stock.code) && `${stock.code} ${stock.name}`.toLowerCase().includes(query.toLowerCase())).slice(0, 6) : [];

  function pickPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 350 * 1024) {
      setMessage("Pilih foto PNG, JPG, atau WebP maksimal 350 KB."); return;
    }
    const reader = new FileReader();
    reader.onload = () => { setPhoto(typeof reader.result === "string" ? reader.result : null); setMessage(""); };
    reader.onerror = () => setMessage("Foto gagal dibaca.");
    reader.readAsDataURL(file);
  }

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/stream", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body, kind, tickers, photo }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Posting gagal disimpan.");
      setBody(""); setTickers([]); setPhoto(null); setKind("status");
      onPosted?.();
      if (window.matchMedia("(max-width: 767px)").matches) router.push(`/stream/user/${encodeURIComponent(username)}`);
      else router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Koneksi gagal."); }
    finally { setBusy(false); }
  }

  if (!canPost) return <div className="border border-rule-hi bg-panel-hi p-4 text-sm text-ink">Masuk dengan akun pribadi untuk menulis, menyukai, dan berkomentar. <Link href="/login" className="font-bold text-cyan hover:underline">Masuk</Link> · <Link href="/register" className="font-bold text-cyan hover:underline">Daftar</Link></div>;
  return <form onSubmit={submit} className="border border-rule-hi bg-panel">
    <div className="flex gap-2 border-b border-rule p-3 sm:p-4"><button type="button" onClick={() => setKind("status")} aria-pressed={kind === "status"} className={`min-h-10 border px-4 text-xs font-bold uppercase ${kind === "status" ? "border-amber bg-amber/10 text-amber" : "border-rule-hi text-ink"}`}>Status</button><button type="button" onClick={() => setKind("thesis")} aria-pressed={kind === "thesis"} className={`min-h-10 border px-4 text-xs font-bold uppercase ${kind === "thesis" ? "border-amber bg-amber/10 text-amber" : "border-rule-hi text-ink"}`}>Thesis</button></div>
    <div className="p-3 sm:p-4"><label className="block"><span className="sr-only">Tulis status atau thesis saham</span><textarea value={body} onChange={(event) => setBody(event.target.value)} maxLength={2000} rows={4} required placeholder="Apa pandanganmu tentang pasar atau saham hari ini? Ketik @ untuk tag teman." className="w-full resize-y bg-transparent text-sm leading-6 text-ink-hi outline-none placeholder:text-dim" /></label><FriendMentions text={body} onChange={setBody} /></div>
    <div className="relative border-t border-rule px-3 py-3 sm:px-4"><label className="block text-micro font-bold uppercase tracking-wider text-dim" htmlFor="stream-stock-search">Tag saham yang kamu beli atau bahas · maks. 5</label><input id="stream-stock-search" value={query} onChange={(event) => setQuery(event.target.value)} disabled={tickers.length >= 5} placeholder="Cari kode atau nama emiten" className="mt-1 min-h-10 w-full border border-rule-hi bg-void px-3 text-sm text-ink-hi outline-none focus:border-amber disabled:opacity-50" />{matches.length > 0 && <div className="absolute left-3 right-3 top-full z-20 max-h-52 overflow-auto border border-rule-hi bg-panel shadow-xl sm:left-4 sm:right-4">{matches.map((stock) => <button key={stock.code} type="button" onClick={() => { setTickers([...tickers, stock.code]); setQuery(""); }} className="flex min-h-10 w-full items-center gap-2 border-b border-rule px-3 text-left text-xs hover:bg-panel-hi"><strong className="text-amber">${stock.code}</strong><span className="truncate text-ink">{stock.name}</span></button>)}</div>}{tickers.length > 0 && <div className="mt-2 flex flex-wrap gap-2">{tickers.map((code) => <button key={code} type="button" onClick={() => setTickers(tickers.filter((item) => item !== code))} className="inline-flex min-h-8 items-center gap-1 border border-cyan/50 px-2 text-xs text-cyan">${code}<X className="h-3 w-3" /></button>)}</div>}</div>
    {photo && <div className="flex items-start gap-3 border-t border-rule p-3"><Image src={photo} alt="Pratinjau foto" width={120} height={80} unoptimized className="max-h-24 w-auto max-w-32 object-contain" /><button type="button" onClick={() => { setPhoto(null); if (fileRef.current) fileRef.current.value = ""; }} className="min-h-9 text-xs text-down">Hapus foto</button></div>}
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-rule p-3 sm:p-4"><div className="flex items-center gap-2"><button type="button" onClick={() => fileRef.current?.click()} className="inline-flex min-h-10 items-center gap-2 border border-rule-hi px-3 text-xs text-cyan hover:border-amber"><Camera className="h-4 w-4" /> Foto</button><input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={pickPhoto} className="hidden" /><span className="text-micro text-dim">{body.length}/2000</span></div><button type="submit" disabled={busy || body.trim().length < 2} className="inline-flex min-h-10 items-center gap-2 bg-amber px-4 text-xs font-bold uppercase text-void disabled:opacity-50"><Send className="h-4 w-4" /> {busy ? "Mengirim…" : "Posting"}</button></div>
    {message && <p role="alert" className="border-t border-rule px-3 py-2 text-xs text-down">{message}</p>}
  </form>;
}

export function StreamFeed({ initialPosts, initialCursor, canInteract, viewerUsername, paginated = false, author }: { initialPosts: StreamPostView[]; initialCursor: string | null; canInteract: boolean; viewerUsername: string; paginated?: boolean; author?: string }) {
  const [extra, setExtra] = useState<StreamPostView[]>([]);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function more() {
    if (!cursor) return;
    setLoading(true); setError("");
    try {
      const response = await fetch(`/api/stream?cursor=${encodeURIComponent(cursor)}${author ? `&author=${encodeURIComponent(author)}` : ""}`);
      if (!response.ok) throw new Error("Posting berikutnya belum bisa dimuat.");
      const result = await response.json() as { posts: StreamPostView[]; nextCursor: string | null };
      setExtra((current) => [...current, ...result.posts]); setCursor(result.nextCursor);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Gagal memuat."); }
    finally { setLoading(false); }
  }
  const posts = [...initialPosts, ...extra];
  return <div className="space-y-3">{posts.length ? posts.map((post) => <StreamCard key={post.id} post={post} canInteract={canInteract} viewerUsername={viewerUsername} />) : <div className="border border-rule bg-panel p-8 text-center text-sm text-dim">Belum ada posting. Jadilah yang pertama membagikan pandangan saham.</div>}{paginated && cursor && <button type="button" onClick={more} disabled={loading} className="min-h-11 w-full border border-rule-hi bg-panel-hi text-xs font-bold text-cyan disabled:opacity-50">{loading ? "Memuat…" : "Muat posting berikutnya"}</button>}{error && <p role="alert" className="text-xs text-down">{error}</p>}</div>;
}

export function StreamCard({ post, canInteract, viewerUsername }: { post: StreamPostView; canInteract: boolean; viewerUsername: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const editFile = useRef<HTMLInputElement>(null);
  const [content, setContent] = useState(post);
  const [liked, setLiked] = useState(post.liked);
  const [likes, setLikes] = useState(post.likes);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [editBody, setEditBody] = useState(post.body);
  const [editKind, setEditKind] = useState(post.kind);
  const [editTickers, setEditTickers] = useState(post.tickers.join(", "));
  const [editPhoto, setEditPhoto] = useState<string | null | undefined>(undefined);
  const [photoRevision, setPhotoRevision] = useState(0);
  const display = content.author.displayName || content.author.username;
  const canManage = canInteract && viewerUsername === content.author.username;

  function pickEditPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 350 * 1024) { setNotice("Pilih foto PNG, JPG, atau WebP maksimal 350 KB."); return; }
    const reader = new FileReader();
    reader.onload = () => { if (typeof reader.result === "string") { setEditPhoto(reader.result); setNotice(""); } };
    reader.onerror = () => setNotice("Foto gagal dibaca.");
    reader.readAsDataURL(file);
  }

  async function saveEdit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setNotice("");
    const tickers = [...new Set(editTickers.split(/[\s,]+/).map((code) => code.trim().toUpperCase()).filter(Boolean))];
    try {
      const response = await fetch(`/api/stream/${post.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: editBody, kind: editKind, tickers, ...(editPhoto !== undefined ? { photo: editPhoto } : {}) }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Posting gagal diubah.");
      setContent({ ...content, body: editBody.trim(), kind: editKind, tickers, hasPhoto: editPhoto === undefined ? content.hasPhoto : Boolean(editPhoto) });
      if (editPhoto !== undefined) setPhotoRevision(Date.now());
      setEditPhoto(undefined); setEditing(false); setNotice("Posting diperbarui."); router.refresh();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Koneksi gagal."); }
    finally { setBusy(false); }
  }

  async function removePost() {
    setBusy(true); setNotice("");
    try {
      const response = await fetch(`/api/stream/${post.id}`, { method: "DELETE" });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Posting gagal dihapus.");
      setDeleted(true);
      if (pathname.startsWith("/stream/post/")) router.replace(`/stream/user/${encodeURIComponent(viewerUsername)}`);
      else router.refresh();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Koneksi gagal."); setConfirmDelete(false); }
    finally { setBusy(false); }
  }
  async function toggleLike() {
    if (!canInteract) { setNotice("Masuk untuk memberi like."); return; }
    setBusy(true);
    try { const res = await fetch(`/api/stream/${post.id}/like`, { method: "POST" }); const data = await res.json() as { liked?: boolean; count?: number; error?: string }; if (!res.ok) throw new Error(data.error); setLiked(Boolean(data.liked)); setLikes(data.count ?? likes); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Like gagal."); }
    finally { setBusy(false); }
  }
  async function submitComment(event: FormEvent) {
    event.preventDefault(); setBusy(true); setNotice("");
    try { const res = await fetch(`/api/stream/${post.id}/comments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: comment }) }); const data = await res.json() as { error?: string }; if (!res.ok) throw new Error(data.error); setComment(""); window.location.reload(); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Komentar gagal."); }
    finally { setBusy(false); }
  }
  async function share() {
    const url = `${window.location.origin}/stream/post/${post.id}`;
    try { if (navigator.share) await navigator.share({ title: `Stream: ${display}`, url }); else { await navigator.clipboard.writeText(url); setNotice("Tautan posting disalin."); } }
    catch (error) { if (error instanceof Error && error.name !== "AbortError") setNotice("Tautan tidak dapat dibagikan."); }
  }
  if (deleted) return null;
  return <article className="min-w-0 border border-rule bg-panel">
    <div className="flex min-w-0 items-center gap-3 p-3 sm:p-4"><StreamAvatar url={content.author.avatarUrl} name={display} /><div className="min-w-0 flex-1"><Link href={`/stream/user/${encodeURIComponent(content.author.username)}`} className="block truncate text-sm font-bold text-ink-hi hover:text-amber">{display}</Link><span className="text-micro text-dim">@{content.author.username} · {new Date(content.createdAt).toLocaleString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "medium", timeStyle: "short" })} WIB</span></div><span className="shrink-0 border border-rule-hi px-2 py-1 text-micro font-bold uppercase text-amber">{content.kind}</span>{canManage && <div className="relative shrink-0"><button type="button" aria-label="Opsi posting" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)} className="grid h-9 w-9 place-items-center border border-rule-hi text-ink hover:text-amber"><MoreHorizontal className="h-5 w-5" /></button>{menuOpen && <div className="absolute right-0 top-full z-20 mt-1 w-36 border border-rule-hi bg-panel-hi p-1 shadow-xl"><button type="button" onClick={() => { setEditing(true); setConfirmDelete(false); setMenuOpen(false); }} className="flex min-h-10 w-full items-center gap-2 px-2 text-left text-xs text-ink-hi hover:bg-panel"><Pencil className="h-4 w-4" /> Edit</button><button type="button" onClick={() => { setConfirmDelete(true); setEditing(false); setMenuOpen(false); }} className="flex min-h-10 w-full items-center gap-2 px-2 text-left text-xs text-down hover:bg-panel"><Trash2 className="h-4 w-4" /> Hapus</button></div>}</div>}</div>
    {confirmDelete && <div className="flex flex-wrap items-center justify-between gap-2 border-t border-down/40 bg-down/10 px-3 py-3 text-xs text-ink-hi"><span>Hapus posting ini beserta komentar dan like?</span><div className="flex gap-2"><button type="button" onClick={() => setConfirmDelete(false)} disabled={busy} className="min-h-9 border border-rule-hi px-3">Batal</button><button type="button" onClick={removePost} disabled={busy} className="min-h-9 border border-down bg-down px-3 font-bold text-void">{busy ? "Menghapus…" : "Hapus posting"}</button></div></div>}
    {editing ? <form onSubmit={saveEdit} className="space-y-3 border-t border-rule p-3 sm:p-4"><label className="block text-xs text-dim">Isi posting<textarea value={editBody} onChange={(event) => setEditBody(event.target.value)} maxLength={2000} minLength={2} required rows={4} className="mt-1 w-full resize-y border border-rule-hi bg-void p-2 text-sm text-ink-hi" /></label><FriendMentions text={editBody} onChange={setEditBody} /><div className="flex flex-wrap gap-3"><label className="text-xs text-dim">Jenis<select value={editKind} onChange={(event) => setEditKind(event.target.value as "status" | "thesis")} className="mt-1 block min-h-10 border border-rule-hi bg-void px-2 text-ink-hi"><option value="status">Status</option><option value="thesis">Thesis</option></select></label><label className="min-w-0 flex-1 text-xs text-dim">Tag saham, pisahkan dengan koma<input value={editTickers} onChange={(event) => setEditTickers(event.target.value)} placeholder="BBCA, TLKM" className="mt-1 block min-h-10 w-full border border-rule-hi bg-void px-2 text-ink-hi" /></label></div><div className="flex flex-wrap items-center gap-3"><button type="button" onClick={() => editFile.current?.click()} className="min-h-10 border border-rule-hi px-3 text-xs text-cyan"><Camera className="mr-1 inline h-4 w-4" /> Ganti foto</button><input ref={editFile} type="file" accept="image/png,image/jpeg,image/webp" onChange={pickEditPhoto} className="hidden" />{(content.hasPhoto || editPhoto) && <button type="button" onClick={() => setEditPhoto(null)} className="min-h-10 text-xs text-down">Hapus foto</button>}{editPhoto === null && <span className="text-xs text-dim">Foto akan dihapus</span>}{typeof editPhoto === "string" && <span className="text-xs text-cyan">Foto baru siap disimpan</span>}</div><div className="flex justify-end gap-2"><button type="button" onClick={() => { setEditing(false); setEditPhoto(undefined); setNotice(""); }} disabled={busy} className="min-h-10 border border-rule-hi px-3 text-xs text-ink">Batal</button><button type="submit" disabled={busy || editBody.trim().length < 2} className="min-h-10 bg-amber px-4 text-xs font-bold text-void disabled:opacity-50">{busy ? "Menyimpan…" : "Simpan"}</button></div></form> : <><div className="whitespace-pre-wrap break-words px-3 pb-3 text-sm leading-6 text-ink-hi sm:px-4"><MentionText text={content.body} /></div>
    {content.tickers.length > 0 && <div className="flex flex-wrap gap-2 px-3 pb-3 sm:px-4">{content.tickers.map((code) => <Link key={code} href={`/asset/${code}`} className="border border-cyan/50 px-2 py-1 text-xs font-bold text-cyan hover:bg-cyan/10">${code}</Link>)}</div>}
    {content.hasPhoto && <Link href={`/stream/post/${post.id}`} className="block border-y border-rule bg-void"><Image src={`/api/stream/${post.id}/photo?v=${photoRevision}`} alt={`Foto posting ${display}`} width={960} height={640} unoptimized className="mx-auto max-h-[32rem] w-auto max-w-full object-contain" /></Link>}</>}
    <div className="flex flex-wrap items-center gap-4 border-t border-rule px-3 py-2 text-xs sm:px-4"><button type="button" onClick={toggleLike} disabled={busy} aria-pressed={liked} className={`inline-flex min-h-9 items-center gap-1.5 ${liked ? "text-down" : "text-dim hover:text-down"}`}><Heart className="h-4 w-4" fill={liked ? "currentColor" : "none"} /> {likes}</button><Link href={`/stream/post/${post.id}`} className="inline-flex min-h-9 items-center gap-1.5 text-dim hover:text-cyan"><MessageCircle className="h-4 w-4" /> {post.comments}</Link><button type="button" onClick={share} className="inline-flex min-h-9 items-center gap-1.5 text-dim hover:text-cyan"><Share2 className="h-4 w-4" /> Bagikan</button></div>
    {post.recentComments.length > 0 && <div className="border-t border-rule px-3 py-2 sm:px-4">{post.recentComments.map((item) => <p key={item.id} className="break-words py-1 text-xs text-ink"><Link href={`/stream/user/${encodeURIComponent(item.author.username)}`} className="font-bold text-cyan hover:underline">@{item.author.username}</Link> <MentionText text={item.body} /></p>)}{post.comments > post.recentComments.length && <Link href={`/stream/post/${post.id}`} className="text-xs text-cyan hover:underline">Lihat semua {post.comments} komentar</Link>}</div>}
    {canInteract && <form onSubmit={submitComment} className="border-t border-rule p-3 sm:p-4"><div className="flex gap-2"><input value={comment} onChange={(event) => setComment(event.target.value)} maxLength={500} required placeholder="Tulis komentar… @ untuk tag teman" aria-label="Tulis komentar" className="min-h-10 min-w-0 flex-1 border border-rule-hi bg-void px-3 text-xs text-ink-hi outline-none focus:border-amber" /><button type="submit" disabled={busy || !comment.trim()} className="min-h-10 border border-amber px-3 text-xs font-bold text-amber disabled:opacity-50">Kirim</button></div><FriendMentions text={comment} onChange={setComment} /></form>}
    {notice && <p role="status" className="border-t border-rule px-3 py-2 text-xs text-cyan">{notice}</p>}
  </article>;
}
