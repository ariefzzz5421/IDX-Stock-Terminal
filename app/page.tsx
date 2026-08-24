import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  BarChart3,
  Building2,
  Eye,
  Globe2,
  Radio,
  Search,
  TerminalSquare,
} from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { missingSettings } from "@/lib/config";
import { MarketStatusBadge } from "@/components/terminal/MarketStatusBadge";
import { CompanyLogo } from "@/components/terminal/CompanyLogo";
import { directionClass, formatPct, formatPrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "IDX Terminal — a Bloomberg-style terminal for the Indonesia Stock Exchange",
  description:
    "Track every company listed on the IDX: live watchlist, candlestick charts, market movers and foreign flow, in a dense terminal built for one operator.",
};

export const dynamic = "force-dynamic";

/**
 * The landing page is the public surface, so it must survive an empty or
 * unreachable database — someone hitting a fresh deployment should still see
 * the product and can open the database-free preview.
 */
async function loadPreview() {
  try {
    const [listed, movers] = await Promise.all([
      prisma.stock.count(),
      prisma.stock.findMany({
        where: { lastChangePct: { not: null }, lastPrice: { not: null } },
        orderBy: { lastValue: "desc" },
        take: 6,
        select: {
          code: true,
          name: true,
          logoUrl: true,
          lastPrice: true,
          lastChangePct: true,
        },
      }),
    ]);
    return { listed, movers };
  } catch {
    return { listed: 0, movers: [] };
  }
}

const FEATURES = [
  {
    icon: TerminalSquare,
    title: "Terminal dashboard",
    body: "A dense multi-panel grid — watchlist, gainers, losers and turnover on one screen, no scrolling between them.",
  },
  {
    icon: Search,
    title: "The whole board",
    body: "Every company listed on the IDX, searchable by ticker or name and ranked by market capitalisation.",
  },
  {
    icon: BarChart3,
    title: "Charts and fundamentals",
    body: "Candlesticks with volume, plus best bid/offer, 52-week range, P/E, P/B and dividend yield per stock.",
  },
  {
    icon: Radio,
    title: "Live market status",
    body: "Open or closed on the real BEI schedule, including Friday's shifted session hours and the midday break.",
  },
  {
    icon: Globe2,
    title: "Foreign flow",
    body: "Net foreign accumulation and distribution, ranked, when a data source is configured.",
  },
  {
    icon: Eye,
    title: "Your own watchlist",
    body: "Create an account and your watchlist and profile are stored in a local database on this machine. Nothing leaves your machine.",
  },
];

export default async function LandingPage() {
  const previewMode = missingSettings().length > 0;
  const { listed, movers } = previewMode
    ? { listed: 0, movers: [] }
    : await loadPreview();
  const user = previewMode ? null : await getCurrentUser();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      {previewMode && (
        <div className="border-b border-amber-dim bg-amber/10 px-5 py-2 text-center text-xs text-dim">
          <span className="font-bold uppercase tracking-[0.12em] text-amber">
            Preview mode
          </span>{" "}
          · Database setup can wait. The public site and a static terminal preview are available now.
        </div>
      )}

      {/* ---------- header ---------- */}
      <header className="sticky top-0 z-30 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-rule bg-void/95 px-5 py-3 backdrop-blur">
        <Link href="/" className="flex items-baseline gap-2.5">
          <span className="font-display text-lg font-bold tracking-[0.16em] text-amber">
            IDX
          </span>
          <span className="text-micro uppercase tracking-[0.2em] text-dim">
            Terminal
          </span>
        </Link>

        <div className="hidden sm:block">
          <MarketStatusBadge />
        </div>

        <nav className="ml-auto flex items-center gap-2">
          {user ? (
            <Link
              href="/dashboard"
              className="bg-amber px-4 py-2 text-micro font-bold uppercase tracking-[0.12em] text-void transition-colors hover:bg-ink-hi"
            >
              Open terminal
            </Link>
          ) : previewMode ? (
            <Link
              href="/preview"
              className="bg-amber px-4 py-2 text-micro font-bold uppercase tracking-[0.12em] text-void transition-colors hover:bg-ink-hi"
            >
              Preview terminal
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="px-3 py-2 text-micro uppercase tracking-[0.12em] text-dim transition-colors hover:text-ink-hi"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="bg-amber px-4 py-2 text-micro font-bold uppercase tracking-[0.12em] text-void transition-colors hover:bg-ink-hi"
              >
                Create account
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* ---------- hero ---------- */}
      <section className="mx-auto w-full max-w-6xl px-5 py-16 sm:py-24">
        <p className="mb-5 inline-flex items-center gap-2 border border-rule-hi px-3 py-1.5 text-micro uppercase tracking-[0.14em] text-dim">
          <Activity aria-hidden="true" className="h-3.5 w-3.5 text-amber" />
          Bursa Efek Indonesia · IDX / BEI
        </p>

        <h1 className="max-w-3xl text-balance text-3xl font-bold leading-[1.15] text-ink-hi sm:text-4xl lg:text-5xl">
          A Bloomberg-style terminal for the{" "}
          <span className="text-amber">Indonesia Stock Exchange</span>.
        </h1>

        <p className="mt-6 max-w-2xl text-base leading-relaxed text-dim">
          {listed > 0 ? (
            <>
              All <span className="text-ink-hi">{listed.toLocaleString("en-US")}</span>{" "}
              listed companies, live prices, candlestick charts and market movers —
              dense, dark, and built for one operator.
            </>
          ) : (
            <>
              Every listed company, live prices, candlestick charts and market
              movers — dense, dark, and built for one operator.
            </>
          )}{" "}
          Runs entirely on your own machine.
        </p>

        <div className="mt-9 flex flex-wrap items-center gap-3">
          <Link
            href={previewMode ? "/preview" : "/dashboard"}
            className="inline-flex items-center gap-2 bg-amber px-6 py-3 text-sm font-bold uppercase tracking-[0.1em] text-void transition-colors hover:bg-ink-hi"
          >
            <TerminalSquare aria-hidden="true" className="h-4 w-4" />
            {previewMode ? "Preview the terminal" : "Open the terminal"}
          </Link>
          {!user && !previewMode && (
            <Link
              href="/register"
              className="inline-flex items-center gap-2 border border-rule-hi px-6 py-3 text-sm uppercase tracking-[0.1em] text-ink transition-colors hover:border-amber hover:text-amber"
            >
              Create a free account
            </Link>
          )}
        </div>

        <p className="mt-4 text-xs text-dimmer">
          {previewMode
            ? "Preview data is static and clearly labelled. Set SESSION_SECRET to enable accounts, watchlists, price history and the real dashboard."
            : user
              ? `Signed in as ${user.username}.`
              : "You can look around without an account — sign up to keep your own watchlist."}
        </p>
      </section>

      {/* ---------- live movers ---------- */}
      {movers.length > 0 && (
        <section className="border-y border-rule bg-panel">
          <div className="mx-auto w-full max-w-6xl px-5 py-6">
            <h2 className="mb-4 text-micro font-bold uppercase tracking-[0.16em] text-amber">
              Most traded right now
            </h2>
            <ul className="grid gap-px bg-rule sm:grid-cols-2 lg:grid-cols-3">
              {movers.map((stock) => (
                <li key={stock.code}>
                  <Link
                    href={`/stock/${stock.code}`}
                    className="flex items-center gap-3 bg-panel px-4 py-3 transition-colors hover:bg-panel-hi"
                  >
                    <CompanyLogo code={stock.code} logoUrl={stock.logoUrl} />
                    <span className="flex min-w-0 flex-col leading-tight">
                      <span className="text-sm font-bold tracking-[0.05em] text-ink-hi">
                        {stock.code}
                      </span>
                      <span className="truncate text-micro text-dimmer">
                        {stock.name}
                      </span>
                    </span>
                    <span className="ml-auto flex flex-col items-end leading-tight">
                      <span className="text-sm text-ink">
                        {formatPrice(stock.lastPrice)}
                      </span>
                      <span
                        className={`text-xs font-medium ${directionClass(stock.lastChangePct)}`}
                      >
                        {formatPct(stock.lastChangePct)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ---------- features ---------- */}
      <section className="mx-auto w-full max-w-6xl px-5 py-16">
        <h2 className="mb-2 text-micro font-bold uppercase tracking-[0.16em] text-amber">
          What&rsquo;s inside
        </h2>
        <p className="mb-8 max-w-2xl text-sm text-dim">
          {previewMode
            ? "Explore the interface with sample data now. The real dashboard needs SESSION_SECRET set — see the README."
            : "Everything runs against an embedded local database, with market data from a swappable provider."}
        </p>

        <div className="grid gap-px bg-rule md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <article key={title} className="bg-panel p-5">
              <Icon aria-hidden="true" className="mb-3 h-5 w-5 text-amber" />
              <h3 className="mb-2 text-sm font-semibold text-ink-hi">{title}</h3>
              <p className="text-xs leading-relaxed text-dim">{body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ---------- account CTA ---------- */}
      {!user && !previewMode && (
        <section className="border-t border-rule bg-panel">
          <div className="mx-auto w-full max-w-6xl px-5 py-14">
            <div className="flex flex-wrap items-center gap-x-10 gap-y-6">
              <div className="max-w-xl">
                <h2 className="mb-3 text-xl font-bold text-ink-hi">
                  Your data stays on your machine.
                </h2>
                <p className="text-sm leading-relaxed text-dim">
                  Sign up with just a username and a password — no email, no
                  verification, no third party. Your account, watchlist and profile
                  are written to a database file on this computer, and
                  nothing is sent anywhere else.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/register"
                  className="bg-amber px-6 py-3 text-sm font-bold uppercase tracking-[0.1em] text-void transition-colors hover:bg-ink-hi"
                >
                  Create account
                </Link>
                <Link
                  href="/login"
                  className="border border-rule-hi px-6 py-3 text-sm uppercase tracking-[0.1em] text-dim transition-colors hover:border-amber hover:text-amber"
                >
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ---------- footer ---------- */}
      <footer className="mt-auto border-t border-rule px-5 py-6">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 text-micro uppercase tracking-[0.1em] text-dimmer">
          <span className="inline-flex items-center gap-2">
            <Building2 aria-hidden="true" className="h-3.5 w-3.5" />
            IDX Terminal
          </span>
          <a
            href="https://github.com/ariefzzz5421/IDX-Stock-Terminal"
            className="transition-colors hover:text-amber"
          >
            Source on GitHub
          </a>
          <span className="ml-auto normal-case tracking-normal">
            {previewMode ? "Preview data only. " : "Delayed third-party data. "}
            Not investment advice.
          </span>
        </div>
      </footer>
    </div>
  );
}
