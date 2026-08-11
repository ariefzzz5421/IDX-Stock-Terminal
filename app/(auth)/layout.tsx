import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-rule px-5 py-3">
        <Link href="/" className="flex items-baseline gap-2.5">
          <span className="font-display text-lg font-bold tracking-[0.16em] text-amber">
            IDX
          </span>
          <span className="text-micro uppercase tracking-[0.2em] text-dim">
            Terminal
          </span>
        </Link>

        {/* Without this, anyone who lands on /login has no way out but the
            back button — the terminal is browsable without an account. */}
        <Link
          href="/dashboard"
          className="ml-auto inline-flex items-center gap-1.5 text-micro uppercase tracking-[0.12em] text-dim transition-colors hover:text-amber"
        >
          <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
          Back to terminal
        </Link>
      </header>

      <div className="flex flex-1 items-center justify-center p-6">{children}</div>
    </div>
  );
}
