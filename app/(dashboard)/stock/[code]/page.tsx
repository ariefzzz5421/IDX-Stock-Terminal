import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BookOpen,
  Building2,
  ExternalLink,
  Globe2,
  Landmark,
  Users,
} from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/session";
import { marketData } from "@/lib/market-data";
import { refreshQuotes } from "@/lib/market-data/sync";
import { getCompanyDetails } from "@/lib/market-data/company-details";
import { Panel } from "@/components/terminal/Panel";
import { Chart } from "@/components/terminal/Chart";
import { CompanyLogo } from "@/components/terminal/CompanyLogo";
import { WatchlistToggle } from "@/components/terminal/WatchlistToggle";
import {
  directionClass,
  formatChange,
  formatPct,
  formatPrice,
  formatValue,
  formatVolume,
} from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/stock/[code]">): Promise<Metadata> {
  const { code } = await params;
  return { title: `${code.toUpperCase()} — IDX Terminal` };
}

export default async function StockPage({ params }: PageProps<"/stock/[code]">) {
  const user = await requireUser();
  const { code: raw } = await params;
  const code = raw.toUpperCase();

  const stock = await prisma.stock.findUnique({ where: { code } });
  if (!stock) notFound();

  const refresh = refreshQuotes([code]);
  const detailsPromise = getCompanyDetails(code);
  const candlesPromise = marketData.getOHLCV(code, "5m", 120).catch((error) => {
    console.error(`[stock] OHLCV for ${code} failed:`, error);
    return [];
  });
  const watchedPromise = prisma.watchlist.findUnique({
    where: { userId_stockCode: { userId: user.id, stockCode: code } },
    select: { id: true },
  });

  const [, details, candles, watched] = await Promise.all([
    refresh,
    detailsPromise,
    candlesPromise,
    watchedPromise,
  ]);

  const fresh = (await prisma.stock.findUnique({ where: { code } })) ?? stock;
  const change =
    fresh.lastPrice != null && fresh.prevClose != null
      ? fresh.lastPrice - fresh.prevClose
      : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-px">
      <section className="flex flex-wrap items-end gap-x-10 gap-y-4 bg-panel px-5 py-4">
        <div className="flex items-center gap-3.5">
          <CompanyLogo code={fresh.code} logoUrl={fresh.logoUrl} size="lg" />
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-xl font-bold leading-none tracking-[0.08em] text-amber">
              {fresh.code}
            </h1>
            <p className="max-w-[32rem] text-xs leading-snug text-dim">
              {fresh.name}
              {details?.industry ? ` · ${details.industry}` : fresh.sector ? ` · ${fresh.sector}` : ""}
            </p>
          </div>
        </div>

        <div>
          <div className="text-2xl font-bold leading-none text-ink-hi">
            {formatPrice(fresh.lastPrice)}
          </div>
          <div className={`mt-1.5 text-sm font-medium ${directionClass(change)}`}>
            {formatChange(change)} &nbsp; {formatPct(fresh.lastChangePct)}
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-x-8 gap-y-2.5 sm:grid-cols-3 lg:grid-cols-5">
          <Stat k="Prev close" v={formatPrice(fresh.prevClose)} />
          <Stat k="Volume" v={formatVolume(fresh.lastVolume)} />
          <Stat k="Turnover" v={formatValue(fresh.lastValue)} />
          <Stat k="Market cap" v={formatValue(fresh.marketCap)} />
          <Stat k="Updated" v={`${fresh.updatedAt.toISOString().slice(11, 19)} UTC`} />
        </dl>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="#orderbook"
            className="inline-flex items-center gap-1.5 border border-rule-hi px-3 py-2 text-xs text-dim hover:border-amber hover:text-amber"
          >
            <BookOpen aria-hidden="true" className="h-3.5 w-3.5" />
            Orderbook
          </Link>
          <WatchlistToggle code={code} initiallyWatched={Boolean(watched)} />
        </div>
      </section>

      <div className="grid gap-px xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Panel
          title="Chart"
          meta={`5m · ${candles.length} bars · ${marketData.name}`}
          bodyClassName="min-h-[25rem]"
        >
          <Chart candles={candles} />
        </Panel>

        <Panel
          title="Best Bid / Offer"
          meta={details?.orderBook.source ? `${details.orderBook.source} snapshot` : "unavailable"}
          bodyClassName=""
          className="scroll-mt-3"
        >
          <div id="orderbook" className="scroll-mt-28 p-4">
            <div className="grid grid-cols-2 gap-px bg-rule">
              <OrderSide
                label="Best bid"
                price={details?.orderBook.bid ?? null}
                volume={details?.orderBook.bidVolume ?? null}
                tone="buy"
              />
              <OrderSide
                label="Best offer"
                price={details?.orderBook.offer ?? null}
                volume={details?.orderBook.offerVolume ?? null}
                tone="sell"
              />
            </div>
            <p className="mt-3 text-micro leading-relaxed text-dimmer">
              This is the latest delayed best bid/offer snapshot, not full live market depth.
              {details?.orderBook.asOf ? ` Trading date ${details.orderBook.asOf}.` : ""}
            </p>

            <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4 border-t border-rule pt-4">
              <Stat k="Open" v={formatPrice(details?.quote.open)} />
              <Stat k="Day high" v={formatPrice(details?.quote.high)} />
              <Stat k="Day low" v={formatPrice(details?.quote.low)} />
              <Stat k="52W high" v={formatPrice(details?.quote.week52High)} />
              <Stat k="52W low" v={formatPrice(details?.quote.week52Low)} />
              <Stat k="P/E" v={formatRatio(details?.quote.trailingPE)} />
              <Stat k="P/B" v={formatRatio(details?.quote.priceToBook)} />
              <Stat k="Dividend yield" v={formatOptionalPct(details?.quote.dividendYield)} />
            </dl>
          </div>
        </Panel>
      </div>

      <div className="grid gap-px xl:grid-cols-[minmax(0,1.25fr)_minmax(22rem,0.75fr)]">
        <Panel
          title="Company Overview"
          meta={details?.sources.join(" · ") ?? "catalogue only"}
          bodyClassName=""
        >
          <div className="space-y-5 p-5">
            <div className="flex items-start gap-3">
              <Building2 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-amber" />
              <div>
                <h3 className="text-sm font-semibold text-ink-hi">{fresh.name}</h3>
                <p className="mt-2 max-w-4xl text-sm leading-6 text-dim">
                  {details?.summary ??
                    "A business description is not available from the connected public sources for this security."}
                </p>
              </div>
            </div>

            <div className="grid gap-px bg-rule sm:grid-cols-2 lg:grid-cols-4">
              <Fact icon={Landmark} label="Listing board" value={details?.listingBoard ?? "—"} />
              <Fact icon={Building2} label="Listed" value={formatDate(details?.listingDate)} />
              <Fact icon={Users} label="Employees" value={formatVolume(details?.employees)} />
              <Fact icon={Globe2} label="Sector" value={details?.sector ?? fresh.sector ?? "—"} />
            </div>

            <dl className="grid grid-cols-2 gap-x-8 gap-y-4 border-t border-rule pt-4 sm:grid-cols-4">
              <Stat k="Shares outstanding" v={formatVolume(details?.quote.sharesOutstanding)} />
              <Stat k="Float shares" v={formatVolume(details?.quote.floatShares)} />
              <Stat k="Industry" v={details?.industry ?? "—"} />
              <Stat k="Address" v={details?.address ?? "—"} />
            </dl>

            {safeWebsite(details?.website) && (
              <a
                href={safeWebsite(details?.website) ?? undefined}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-amber hover:underline"
              >
                Official company website
                <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </Panel>

        <Panel
          title="Holder Percentage"
          meta={details?.ownership.asOf ? `KSEI ${details.ownership.asOf}` : "unavailable"}
          bodyClassName=""
        >
          <div className="p-5">
            <OwnershipBar
              local={details?.ownership.localPct ?? null}
              foreign={details?.ownership.foreignPct ?? null}
              other={details?.ownership.unrecordedPct ?? null}
            />
            <dl className="mt-5 grid grid-cols-2 gap-4">
              <Stat k="Local holding" v={formatPlainPct(details?.ownership.localPct)} />
              <Stat k="Foreign holding" v={formatPlainPct(details?.ownership.foreignPct)} />
              <Stat k="Held by insiders" v={formatPlainPct(details?.ownership.insidersPct)} />
              <Stat k="Held by institutions" v={formatPlainPct(details?.ownership.institutionsPct)} />
            </dl>
            <p className="mt-4 text-micro leading-relaxed text-dimmer">
              Local/foreign percentages are KSEI scripless holdings, not public free float.
              Unrecorded includes certificates or securities outside that snapshot.
            </p>

            <div className="mt-5 border-t border-rule pt-4">
              <h3 className="text-micro font-semibold uppercase tracking-[0.12em] text-dim">
                Major shareholders
              </h3>
              {details?.majorShareholders.length ? (
                <ul className="mt-3 space-y-2">
                  {details.majorShareholders.slice(0, 8).map((holder) => (
                    <li key={`${holder.name}-${holder.shares}`} className="flex gap-3 text-xs">
                      <span className="min-w-0 flex-1 truncate text-dim">{holder.name}</span>
                      <span className="text-ink">{formatPlainPct(holder.percentage)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-xs leading-relaxed text-dimmer">
                  The IDX shareholder-name feed is temporarily unavailable. Aggregate KSEI
                  ownership above remains dated and visible.
                </p>
              )}
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function OrderSide({
  label,
  price,
  volume,
  tone,
}: {
  label: string;
  price: number | null;
  volume: number | null;
  tone: "buy" | "sell";
}) {
  return (
    <div className="bg-panel-hi p-4">
      <p className="text-micro uppercase tracking-[0.12em] text-dimmer">{label}</p>
      <p className={`mt-2 text-xl font-bold ${tone === "buy" ? "text-up" : "text-down"}`}>
        {formatPrice(price)}
      </p>
      <p className="mt-1 text-xs text-dim">Size {formatVolume(volume)}</p>
    </div>
  );
}

function OwnershipBar({
  local,
  foreign,
  other,
}: {
  local: number | null;
  foreign: number | null;
  other: number | null;
}) {
  if (local == null && foreign == null) {
    return <p className="text-sm text-dim">Ownership snapshot unavailable.</p>;
  }
  return (
    <div>
      <div className="flex h-3 overflow-hidden bg-void" aria-label="Ownership composition">
        <span className="bg-amber" style={{ width: `${Math.max(0, local ?? 0)}%` }} />
        <span className="bg-sky-400" style={{ width: `${Math.max(0, foreign ?? 0)}%` }} />
        <span className="bg-rule-hi" style={{ width: `${Math.max(0, other ?? 0)}%` }} />
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-micro text-dimmer">
        <Legend color="bg-amber" label="Local" />
        <Legend color="bg-sky-400" label="Foreign" />
        <Legend color="bg-rule-hi" label="Unrecorded" />
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden="true" className={`h-2 w-2 ${color}`} />
      {label}
    </span>
  );
}

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building2;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-panel-hi p-3">
      <Icon aria-hidden="true" className="h-4 w-4 text-dimmer" />
      <p className="mt-2 text-micro uppercase tracking-[0.1em] text-dimmer">{label}</p>
      <p className="mt-1 truncate text-xs text-ink" title={value}>{value}</p>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-micro uppercase tracking-[0.12em] text-dim">{k}</dt>
      <dd className="break-words text-sm text-ink">{v}</dd>
    </div>
  );
}

function formatRatio(value: number | null | undefined) {
  return value == null || !Number.isFinite(value) ? "—" : `${value.toFixed(2)}x`;
}

function formatOptionalPct(value: number | null | undefined) {
  return value == null || !Number.isFinite(value) ? "—" : `${(value * 100).toFixed(2)}%`;
}

function formatPlainPct(value: number | null | undefined) {
  return value == null || !Number.isFinite(value) ? "—" : `${value.toFixed(2)}%`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(parsed);
}

function safeWebsite(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value.startsWith("http") ? value : `https://${value}`);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}
