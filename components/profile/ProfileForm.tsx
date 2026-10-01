"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { avatarPresets } from "@/lib/avatar-presets";
import { ThemeControl } from "./ThemeControl";

const MAX_BIO = 280;
const MAX_UPLOAD_BYTES = 350 * 1024;

type Props = {
  username: string;
  memberSince: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
};

export function ProfileForm(props: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(props.displayName);
  const [bio, setBio] = useState(props.bio);
  const [avatarUrl, setAvatarUrl] = useState(props.avatarUrl);
  const presets = useMemo(() => avatarPresets(props.username), [props.username]);
  const [status, setStatus] = useState<
    { kind: "error" | "ok"; text: string } | null
  >(null);
  const [busy, setBusy] = useState(false);

  function pickAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setStatus({ kind: "error", text: "Berkas tersebut bukan gambar." });
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      setStatus({
        kind: "error",
        text: "Gambar terlalu besar. Pilih yang kurang dari 350 KB.",
      });
      return;
    }

    // Read as a data URI so the avatar lives in Postgres — no blob store, and
    // it survives a redeploy on an ephemeral filesystem.
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarUrl(reader.result as string);
      setStatus(null);
    };
    reader.onerror = () =>
      setStatus({ kind: "error", text: "Berkas tidak dapat dibaca." });
    reader.readAsDataURL(file);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setStatus(null);

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, bio, avatarUrl }),
      });
      const data = (await response.json()) as { error?: string };
      if (response.ok) {
        setStatus({ kind: "ok", text: "Profil tersimpan." });
        router.refresh();
      } else {
        setStatus({ kind: "error", text: data.error ?? "Profil tidak dapat disimpan." });
      }
    } catch {
      setStatus({ kind: "error", text: "Koneksi gagal. Silakan coba lagi." });
    } finally {
      setBusy(false);
    }
  }

  const initials = (displayName.trim() || props.username).slice(0, 2).toUpperCase();

  return (
    <form onSubmit={handleSubmit} className="max-w-xl">
      <div className="mb-6 flex items-center gap-4">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt="Avatar Anda"
            width={64}
            height={64}
            className="h-16 w-16 shrink-0 border border-rule-hi object-cover"
            unoptimized
          />
        ) : (
          <span
            aria-hidden="true"
            className="grid h-16 w-16 shrink-0 place-items-center border border-rule-hi bg-amber-dim text-lg font-bold text-ink-hi"
          >
            {initials}
          </span>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="border border-rule-hi px-2.5 py-1.5 text-[10px] uppercase tracking-[0.12em] text-dim transition-colors hover:border-amber hover:text-amber"
          >
            Pilih gambar
          </button>
          {avatarUrl && (
            <button
              type="button"
              onClick={() => setAvatarUrl(null)}
              className="border border-rule-hi px-2.5 py-1.5 text-[10px] uppercase tracking-[0.12em] text-dim transition-colors hover:border-down hover:text-down"
            >
              Hapus
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={pickAvatar}
            className="hidden"
          />
        </div>
      </div>

      <ThemeControl />

      <fieldset className="mb-6">
        <legend className="mb-2 text-[10px] uppercase tracking-[0.14em] text-dim">Avatar karakter</legend>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
          {presets.map((preset) => (
            <button
              key={preset.name}
              type="button"
              title={preset.name}
              aria-label={`Pilih avatar ${preset.name}`}
              aria-pressed={avatarUrl === preset.url}
              onClick={() => { setAvatarUrl(preset.url); setStatus(null); }}
              className={`flex min-w-0 flex-col items-center gap-1 border p-1.5 text-[10px] transition-colors hover:border-amber ${avatarUrl === preset.url ? "border-amber text-amber" : "border-rule-hi text-dim"}`}
            >
              <Image src={preset.url} alt="" width={48} height={48} unoptimized className="h-12 w-12 max-w-full" />
              <span className="truncate">{preset.name}</span>
            </button>
          ))}
        </div>
        <p className="mt-2 text-[10px] text-dim">Pilih karakter lalu simpan profil. Gambar dibuat lokal tanpa layanan eksternal.</p>
      </fieldset>

      <Field label="Nama pengguna">
        <p className="border border-rule bg-void px-3 py-2 text-[13px] text-dim">
          {props.username}
          <span className="ml-2 text-[10px] uppercase tracking-[0.1em] text-dimmer">
            sejak {props.memberSince}
          </span>
        </p>
      </Field>

      <Field label="Nama tampilan" htmlFor="displayName">
        <input
          id="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={40}
          placeholder={props.username}
          className="w-full border border-rule-hi bg-void px-3 py-2 text-[13px] text-ink-hi outline-none placeholder:text-dimmer focus:border-amber"
        />
      </Field>

      <Field label="Bio" htmlFor="bio">
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={MAX_BIO}
          rows={4}
          className="w-full resize-y border border-rule-hi bg-void px-3 py-2 text-[13px] leading-relaxed text-ink-hi outline-none focus:border-amber"
        />
        <p className="mt-1 text-right text-[10px] text-dimmer">
          {bio.length} / {MAX_BIO}
        </p>
      </Field>

      {status && (
        <p
          role="alert"
          className={`mb-4 border px-3 py-2 text-[12px] ${
            status.kind === "error"
              ? "border-down/40 bg-down/10 text-down"
              : "border-up/40 bg-up/10 text-up"
          }`}
        >
          {status.text}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="bg-amber px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-void transition-colors hover:bg-ink-hi disabled:opacity-60"
      >
        {busy ? "Menyimpan…" : "Simpan profil"}
      </button>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-[10px] uppercase tracking-[0.14em] text-dim"
      >
        {label}
      </label>
      {children}
    </div>
  );
}
