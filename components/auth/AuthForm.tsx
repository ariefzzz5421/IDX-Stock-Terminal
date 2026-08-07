"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { PASSWORD_MIN, USERNAME_MAX } from "@/lib/auth/validation";

type Mode = "login" | "register";

const COPY = {
  login: {
    heading: "Sign in",
    blurb: "Enter your credentials to open the terminal.",
    submit: "Sign in",
    busy: "Signing in…",
    endpoint: "/api/auth/login",
    altPrompt: "No account yet?",
    altLabel: "Create one",
    altHref: "/register",
  },
  register: {
    heading: "Create account",
    blurb: "Username and password only. No email, no verification.",
    submit: "Create account",
    busy: "Creating…",
    endpoint: "/api/auth/register",
    altPrompt: "Already registered?",
    altLabel: "Sign in",
    altHref: "/login",
  },
} as const;

export function AuthForm({ mode }: { mode: Mode }) {
  const copy = COPY[mode];
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
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
        setError(
          data.error ?? `Server error ${response.status}. Check the server logs.`,
        );
        setBusy(false);
        return;
      }

      // Server components read the session cookie, so the cache has to drop.
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("Could not reach the server. Is it still running?");
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
          Username
        </label>
        <input
          id="username"
          name="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={USERNAME_MAX}
          required
          disabled={busy}
          className="mb-4 w-full border border-rule-hi bg-void px-3 py-2 text-[13px] text-ink-hi outline-none placeholder:text-dimmer focus:border-amber disabled:opacity-50"
        />

        <label
          htmlFor="password"
          className="mb-1.5 block text-[10px] uppercase tracking-[0.14em] text-dim"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          minLength={mode === "register" ? PASSWORD_MIN : undefined}
          required
          disabled={busy}
          className="w-full border border-rule-hi bg-void px-3 py-2 text-[13px] text-ink-hi outline-none focus:border-amber disabled:opacity-50"
        />
        {mode === "register" && (
          <p className="mt-1.5 text-[10px] text-dimmer">
            At least {PASSWORD_MIN} characters.
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
