"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useState, type FormEvent } from "react";
import { PASSWORD_MIN, USERNAME_MAX } from "@/lib/auth/validation";

type Mode = "login" | "register";

const COPY = {
  login: {
    heading: "Masuk",
    blurb: "Masukkan nama pengguna dan kata sandi untuk membuka terminal.",
    submit: "Masuk",
    busy: "Sedang masuk…",
    endpoint: "/api/auth/login",
    altPrompt: "Belum punya akun?",
    altLabel: "Daftar",
    altHref: "/register",
  },
  register: {
    heading: "Buat akun",
    blurb: "Cukup nama pengguna dan kata sandi. Tidak perlu email.",
    submit: "Buat akun",
    busy: "Membuat akun…",
    endpoint: "/api/auth/register",
    altPrompt: "Sudah punya akun?",
    altLabel: "Masuk",
    altHref: "/login",
  },
} as const;

export function AuthForm({ mode }: { mode: Mode }) {
  const copy = COPY[mode];
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [usernameTaken, setUsernameTaken] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setUsernameTaken(false);
    setBusy(true);

    try {
      const response = await fetch(copy.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      // A crashed route can return an empty body; parsing it must not be
      // mistaken for the network being down.
      const data = (await response
        .json()
        .catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        if (mode === "register" && response.status === 409) {
          setUsernameTaken(true);
          setBusy(false);
          return;
        }
        setError(
          data.error ?? `Kesalahan server ${response.status}. Silakan coba lagi.`,
        );
        setBusy(false);
        return;
      }

      // Server components read the session cookie, so the cache has to drop.
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("Server tidak dapat dihubungi. Periksa koneksi dan coba lagi.");
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-sm border border-rule-hi bg-panel">
      <header className="flex items-baseline gap-3 border-b border-rule bg-panel-hi px-4 py-3">
        <span className="font-display text-base font-bold tracking-[0.16em] text-amber">
          IDX
        </span>
        <span className="text-[10px] uppercase tracking-[0.2em] text-dim">
          Terminal
        </span>
      </header>

      <form onSubmit={handleSubmit} className="px-4 py-5">
        <h1 className="mb-1 text-lg text-ink-hi">{copy.heading}</h1>
        <p className="mb-5 text-[12px] leading-relaxed text-dim">{copy.blurb}</p>

        <label
          htmlFor="username"
          className="mb-1.5 block text-[10px] uppercase tracking-[0.14em] text-dim"
        >
          Nama pengguna
        </label>
        <input
          id="username"
          name="username"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            setUsernameTaken(false);
          }}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={USERNAME_MAX}
          required
          disabled={busy}
          aria-invalid={usernameTaken}
          aria-describedby={usernameTaken ? "username-taken" : undefined}
          className="mb-4 w-full border border-rule-hi bg-void px-3 py-2 text-[13px] text-ink-hi outline-none placeholder:text-dimmer focus:border-amber disabled:opacity-50"
        />
        {usernameTaken && (
          <p id="username-taken" role="alert" className="-mt-2 mb-4 text-[11px] text-down">
            Nama pengguna ini sudah digunakan. Pilih nama lain.
          </p>
        )}

        <label
          htmlFor="password"
          className="mb-1.5 block text-[10px] uppercase tracking-[0.14em] text-dim"
        >
          Kata sandi
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            minLength={mode === "register" ? PASSWORD_MIN : undefined}
            required
            disabled={busy}
            className="w-full border border-rule-hi bg-void py-2 pl-3 pr-12 text-[13px] text-ink-hi outline-none focus:border-amber disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
            aria-pressed={showPassword}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-dim transition-colors hover:text-ink-hi focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber"
          >
            {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
          </button>
        </div>
        {mode === "register" && (
          <p className="mt-1.5 text-[10px] text-dimmer">
            Minimal {PASSWORD_MIN} karakter.
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="mt-4 border border-down/40 bg-down/10 px-3 py-2 text-[12px] text-down"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-5 w-full bg-amber px-3 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-void transition-colors hover:bg-ink-hi disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? copy.busy : copy.submit}
        </button>

        <p className="mt-4 text-center text-[11px] text-dim">
          {copy.altPrompt}{" "}
          <Link href={copy.altHref} className="text-cyan hover:underline">
            {copy.altLabel}
          </Link>
        </p>
      </form>
    </div>
  );
}
