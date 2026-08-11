"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  /** Browsing the shared account — offer a way in rather than a way out. */
  guest?: boolean;
};

export function UserBadge({ username, displayName, avatarUrl, guest }: Props) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const label = displayName?.trim() || username;
  const initials = label.slice(0, 2).toUpperCase();

  async function signOut() {
    setSigningOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="flex shrink-0 items-center gap-2.5 px-3 py-1.5">
      <Link
        href="/account"
        className="flex items-center gap-2.5 hover:opacity-80"
        title="Edit profile"
      >
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt=""
            width={26}
            height={26}
            className="h-[26px] w-[26px] shrink-0 object-cover"
            unoptimized
          />
        ) : (
          <span
            aria-hidden="true"
            className="grid h-[26px] w-[26px] shrink-0 place-items-center bg-amber-dim text-[11px] font-bold text-ink-hi"
          >
            {initials}
          </span>
        )}
        <span className="hidden flex-col leading-tight sm:flex">
          <span className="text-xs text-ink-hi">{label}</span>
          <span className="text-micro uppercase tracking-[0.1em] text-dim">
            {guest ? "Shared account" : displayName ? username : "Session active"}
          </span>
        </span>
      </Link>

      {guest ? (
        // Sign-up is the action we actually want a guest to take, so it gets
        // the emphasis and "Sign in" stays secondary.
        <span className="flex items-center gap-1.5">
          <Link
            href="/login"
            className="border border-rule-hi px-2.5 py-1.5 text-micro uppercase tracking-[0.1em] text-dim transition-colors hover:border-amber hover:text-amber"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="bg-amber px-2.5 py-1.5 text-micro font-bold uppercase tracking-[0.1em] text-void transition-colors hover:bg-ink-hi"
          >
            Sign up
          </Link>
        </span>
      ) : (
        <button
          type="button"
          onClick={signOut}
          disabled={signingOut}
          className="border border-rule-hi px-2.5 py-1.5 text-micro uppercase tracking-[0.1em] text-dim transition-colors hover:border-down hover:text-down disabled:opacity-50"
        >
          {signingOut ? "…" : "Exit"}
        </button>
      )}
    </div>
  );
}
