"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Globe2, MessageSquareText, UserRound, X } from "lucide-react";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { avatarPresets } from "@/lib/avatar-presets";
import { LanguageControl, useProfileLanguage } from "./LanguageControl";
import { ThemeControl } from "./ThemeControl";
import { SignOutButton } from "./SignOutButton";

const MAX_UPLOAD_BYTES = 350 * 1024;

type Props = {
  username: string;
  memberSince: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  guest: boolean;
};

export function ProfileForm(props: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const language = useProfileLanguage();
  const [savedAvatarUrl, setSavedAvatarUrl] = useState(props.avatarUrl);
  const [avatarUrl, setAvatarUrl] = useState(props.avatarUrl);
  const [editing, setEditing] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ kind: "error" | "ok"; text: string } | null>(null);

  function closeEditor() {
    setAvatarUrl(savedAvatarUrl);
    setStatus(null);
    setEditing(false);
  }

  function pickAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > MAX_UPLOAD_BYTES) {
      setStatus({ kind: "error", text: "Pilih gambar di bawah 350 KB." });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => { setAvatarUrl(reader.result as string); setStatus(null); };
    reader.onerror = () => setStatus({ kind: "error", text: "Gambar tidak dapat dibaca." });
    reader.readAsDataURL(file);
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setStatus(null);
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: props.displayName, bio: props.bio, avatarUrl }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Profil gagal disimpan.");
      setSavedAvatarUrl(avatarUrl);
      setEditing(false);
      setStatus({ kind: "ok", text: "Profil tersimpan." });
      router.refresh();
    } catch (error) {
      setStatus({ kind: "error", text: error instanceof Error ? error.message : "Koneksi gagal." });
    } finally { setBusy(false); }
  }

  return <div className="mx-auto w-full max-w-2xl px-4 py-7 sm:px-6 sm:py-10">
    <header className="flex flex-col items-center border-b border-rule pb-8 text-center">
      <Avatar url={savedAvatarUrl} name={props.username} />
      <button type="button" onClick={() => { setEditing(true); setStatus(null); }} className="mt-4 min-h-10 text-sm font-semibold text-cyan hover:underline">
        {language === "id" ? "Ubah Profil" : "Edit Profile"}
      </button>
    </header>

    <section className="mt-8">
      <h2 className="mb-2 px-1 text-micro font-bold uppercase tracking-[0.14em] text-dim">{language === "id" ? "Akun" : "Account"}</h2>
      <div className="border-y border-rule bg-panel">
        <button type="button" onClick={() => setEditing(true)} className="flex min-h-14 w-full items-center gap-3 px-4 text-left hover:bg-panel-hi">
          <UserRound className="h-5 w-5 text-dim" aria-hidden="true" />
          <span className="flex-1 text-sm text-ink-hi">{language === "id" ? "Akun" : "Account"}</span>
          <ChevronRight className="h-4 w-4 text-dim" aria-hidden="true" />
        </button>
        <Link href={`/stream/user/${encodeURIComponent(props.username)}`} className="flex min-h-14 items-center gap-3 border-t border-rule px-4 hover:bg-panel-hi"><MessageSquareText className="h-5 w-5 text-dim" aria-hidden="true" /><span className="flex-1 text-sm text-ink-hi">Profil Stream</span><ChevronRight className="h-4 w-4 text-dim" aria-hidden="true" /></Link>
        {props.guest ? <div className="border-t border-rule px-4 py-3 text-xs text-dim"><p>{language === "id" ? "Akun tamu dapat dipakai bersama." : "Guest accounts may be shared."}</p><div className="mt-2 flex gap-4"><Link href="/register" className="text-cyan">{language === "id" ? "Daftar" : "Sign up"}</Link><Link href="/login" className="text-cyan">{language === "id" ? "Masuk" : "Sign in"}</Link></div></div> : <div className="border-t border-rule px-4 py-3"><SignOutButton english={language === "en"} /></div>}
      </div>
    </section>

    <section className="mt-8">
      <h2 className="mb-2 px-1 text-micro font-bold uppercase tracking-[0.14em] text-dim">{language === "id" ? "Pengaturan" : "Settings"}</h2>
      <div className="divide-y divide-rule border-y border-rule bg-panel">
        <ThemeControl label={language === "id" ? "Mode Gelap" : "Dark Mode"} />
        <div>
          <button type="button" aria-expanded={languageOpen} onClick={() => setLanguageOpen(!languageOpen)} className="flex min-h-14 w-full items-center gap-3 px-4 text-left hover:bg-panel-hi">
            <Globe2 className="h-5 w-5 text-dim" aria-hidden="true" /><span className="flex-1 text-sm text-ink-hi">{language === "id" ? "Bahasa" : "Language"}</span>
            <span className="text-xs text-dim">{language === "id" ? "🇮🇩 Indonesia" : "🇬🇧 English"}</span><ChevronRight className={`h-4 w-4 text-dim transition-transform ${languageOpen ? "rotate-90" : ""}`} aria-hidden="true" />
          </button>
          {languageOpen && <LanguageControl />}
        </div>
      </div>
    </section>

    {status && <p role="status" className={`mt-5 border px-3 py-2 text-xs ${status.kind === "error" ? "border-down/40 text-down" : "border-up/40 text-up"}`}>{status.text}</p>}

    {editing && <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 sm:items-center" onMouseDown={(event) => { if (event.target === event.currentTarget) closeEditor(); }} onKeyDown={(event) => { if (event.key === "Escape") closeEditor(); }}>
      <form onSubmit={save} role="dialog" aria-modal="true" aria-label={language === "id" ? "Ubah profil" : "Edit profile"} className="max-h-[90dvh] w-full max-w-lg overflow-y-auto border border-rule-hi bg-panel shadow-2xl sm:max-h-[85dvh]">
        <div className="flex items-center justify-between border-b border-rule px-4 py-3"><h2 className="font-display text-sm font-bold text-ink-hi">{language === "id" ? "Ubah Profil" : "Edit Profile"}</h2><button type="button" onClick={closeEditor} aria-label="Tutup" className="grid h-10 w-10 place-items-center text-dim hover:text-ink-hi"><X className="h-5 w-5" /></button></div>
        <div className="space-y-5 p-4 sm:p-5">
          <div className="flex flex-col items-center gap-3"><Avatar url={avatarUrl} name={props.username} /><span className="text-xs text-dim">{language === "id" ? "Pilih avatar" : "Choose an avatar"}</span></div>
          <div className="grid grid-cols-3 gap-3">{avatarPresets.map((preset) => <button key={preset.url} type="button" onClick={() => setAvatarUrl(preset.url)} aria-label={`Pilih avatar ${preset.name}`} aria-pressed={avatarUrl === preset.url} className={`flex min-h-28 flex-col items-center justify-center gap-2 border p-2 text-xs ${avatarUrl === preset.url ? "border-amber bg-amber/10 text-amber" : "border-rule-hi text-dim hover:border-amber"}`}><Image src={preset.url} alt="" width={72} height={72} className="h-16 w-16 rounded-full object-cover" /><span>{preset.name}</span></button>)}</div>
          <div className="flex flex-wrap justify-center gap-2"><button type="button" onClick={() => fileRef.current?.click()} className="min-h-10 border border-rule-hi px-3 text-xs text-cyan hover:border-amber">{language === "id" ? "Pilih gambar sendiri" : "Upload image"}</button><button type="button" onClick={() => setAvatarUrl(null)} className="min-h-10 border border-rule-hi px-3 text-xs text-dim hover:border-amber">{language === "id" ? "Hapus avatar" : "Remove avatar"}</button><input ref={fileRef} type="file" accept="image/*" onChange={pickAvatar} className="hidden" /></div>
          <p className="text-micro text-dim">Akun @{props.username} · {language === "id" ? "bergabung" : "joined"} {props.memberSince}</p>
          {status?.kind === "error" && <p role="alert" className="text-xs text-down">{status.text}</p>}
          <button type="submit" disabled={busy} className="min-h-11 w-full bg-amber px-4 text-xs font-bold uppercase tracking-wider text-void disabled:opacity-60">{busy ? "Menyimpan…" : language === "id" ? "Simpan" : "Save"}</button>
        </div>
      </form>
    </div>}
  </div>;
}

function Avatar({ url, name }: { url: string | null; name: string }) {
  return url ? <Image src={url} alt={`Avatar ${name}`} width={112} height={112} unoptimized={url.startsWith("data:")} className="h-24 w-24 rounded-full border border-rule-hi object-cover sm:h-28 sm:w-28" />
    : <span className="grid h-24 w-24 place-items-center rounded-full border border-rule-hi bg-amber/15 font-display text-2xl font-bold text-amber sm:h-28 sm:w-28" aria-label={`Avatar ${name}`}>{name.slice(0, 2).toUpperCase()}</span>;
}
