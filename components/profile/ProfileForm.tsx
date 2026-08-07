"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";

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
  const [status, setStatus] = useState<
    { kind: "error" | "ok"; text: string } | null
  >(null);
  const [busy, setBusy] = useState(false);

  function pickAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setStatus({ kind: "error", text: "That file is not an image." });
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      setStatus({
        kind: "error",
        text: "That image is too large. Pick one under 350 KB.",
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
      setStatus({ kind: "error", text: "Could not read that file." });
    reader.readAsDataURL(file);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setStatus(null);

    const response = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName, bio, avatarUrl }),
    });

    const data = (await response.json()) as { error?: string };

    if (response.ok) {
      setStatus({ kind: "ok", text: "Profile saved." });
      router.refresh();
    } else {
      setStatus({ kind: "error", text: data.error ?? "Could not save." });
    }

    setBusy(false);
  }

  const initials = (displayName.trim() || props.username).slice(0, 2).toUpperCase();

  return (
    <form onSubmit={handleSubmit} className="max-w-xl">
      <div className="mb-6 flex items-center gap-4">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt="Your avatar"
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
            Choose image
          </button>
          {avatarUrl && (
            <button
              type="button"
              onClick={() => setAvatarUrl(null)}
              className="border border-rule-hi px-2.5 py-1.5 text-[10px] uppercase tracking-[0.12em] text-dim transition-colors hover:border-down hover:text-down"
            >
              Remove
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

      <Field label="Username">
        <p className="border border-rule bg-void px-3 py-2 text-[13px] text-dim">
          {props.username}
          <span className="ml-2 text-[10px] uppercase tracking-[0.1em] text-dimmer">
            since {props.memberSince}
          </span>
        </p>
      </Field>

      <Field label="Display name" htmlFor="displayName">
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
        {busy ? "Saving…" : "Save profile"}
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
