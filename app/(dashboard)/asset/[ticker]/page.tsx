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
import { getCompanyDetails } from "@/lib/market-data/company-details";
import { companySummaryId } from "@/lib/company-summary-id";
import { Panel } from "@/components/terminal/Panel";
import { ResizableSplit } from "@/components/terminal/ResizableSplit";
import { Chart } from "@/components/terminal/Chart";
import { CompanyLogo } from "@/components/terminal/CompanyLogo";
import { WatchlistToggle } from "@/components/terminal/WatchlistToggle";
import { ShareholderList } from "@/components/terminal/ShareholderList";
import { shareholdersFor } from "@/lib/shareholders";
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
}: PageProps<"/asset/[ticker]">): Promise<Metadata> {
  const { ticker } = await params;
  return { title: `${ticker.toUpperCase()} — IDX Terminal` };
}

export default async function StockPage({ params }: PageProps<"/asset/[ticker]">) {
  const user = await requireUser();
  const { ticker: raw } = await params;
  const code = raw.toUpperCase();

  const stock = await prisma.stock.findUnique({ where: { code } });
  if (!stock) notFound();

  const quotePromise = marketData.getQuote(code).catch((error) => {
    console.error(`[stock] quote for ${code} failed:`, error);
    return null;
  });
  const detailsPromise = getCompanyDetails(code);
  const candlesPromise = marketData.getOHLCV(code, "5m", 120).catch((error) => {
    console.error(`[stock] OHLCV for ${code} failed:`, error);
    return [];
  });
  const watchedPromise = prisma.watchlist.findUnique({
    where: { userId_stockCode: { userId: user.id, stockCode: code } },
    select: { id: true },
  });

  const [quote, details, candles, watched] = await Promise.all([
    quotePromise,
    detailsPromise,
    candlesPromise,
    watchedPromise,
  ]);
  const namedShareholders = shareholdersFor(code);

  const fresh = quote ? {
    ...stock,
    lastPrice: quote.price,
    prevClose: quote.prevClose,
    lastChangePct: quote.changePct,
    lastVolume: quote.volume,
    lastValue: quote.value,
    updatedAt: new Date(quote.timestamp),
  } : stock;
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
            {!fresh.isListed && <p className="text-xs font-semibold text-amber">Tidak tercatat di daftar emiten BEI saat ini · data harga mungkin historis</p>}
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
          <Stat k="Penutupan lalu" v={formatPrice(fresh.prevClose)} />
          <Stat k="Volume" v={formatVolume(fresh.lastVolume)} />
          <Stat k={quote && marketData.name === "yahoo" ? "Nilai transaksi est." : "Nilai transaksi"} v={formatValue(fresh.lastValue)} />
          <Stat k="Kapitalisasi pasar" v={formatValue(fresh.marketCap)} />
          <Stat k="Diperbarui" v={`${fresh.updatedAt.toISOString().slice(11, 19)} UTC${quote ? " · tertunda" : " · tersimpan"}`} />
        </dl>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="#orderbook"
            className="inline-flex items-center gap-1.5 border border-rule-hi px-3 py-2 text-xs text-dim hover:border-amber hover:text-amber"
          >
            <BookOpen aria-hidden="true" className="h-3.5 w-3.5" />
            Bid / Offer
          </Link>
          <WatchlistToggle code={code} initiallyWatched={Boolean(watched)} />
        </div>
      </section>

      <Panel
        title="Ringkasan Harga & Keuangan"
        meta={details?.financials.source ? `${details.financials.source} · ${details.financials.currency ?? "mata uang N/D"}` : "Data keuangan publik belum tersedia"}
        bodyClassName=""
      >
        <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 xl:grid-cols-6">
          <Stat k="Harga terakhir" v={formatPrice(fresh.lastPrice)} />
          <Stat k="Kapitalisasi pasar" v={formatValue(fresh.marketCap)} />
          <Stat k="P/E (historis)" v={formatRatio(details?.quote.trailingPE)} />
          <Stat k="Pendapatan" v={financialValue(details?.financials.totalRevenue, details?.financials.currency)} />
          <Stat k="Laba bersih" v={financialValue(details?.financials.netIncome, details?.financials.currency)} />
          <Stat k="Arus kas bebas" v={financialValue(details?.financials.freeCashflow, details?.financials.currency)} />
        </div>
        <p className="border-t border-rule px-4 py-2 text-micro text-dim">
          Angka menggunakan mata uang laporan emiten di atas; periode dapat berbeda antar emiten. N/D berarti sumber tidak menyediakan angka atau mata uang.
        </p>
      </Panel>

      <ResizableSplit
        storageKey="stock-orderbook"
        resizableSide="right"
        defaultWidth={352}
        leftLabel="beli / jual"
        left={
          <Panel
            title="Grafik"
            className="h-full"
            meta={`5 menit · ${candles.length} batang · ${marketData.name}`}
            bodyClassName="min-h-[25rem]"
          >
            <Chart candles={candles} />
          </Panel>
        }
        right={
          <Panel
            title="Bid / Offer Terbaik"
            className="h-full scroll-mt-3"
            meta={details?.orderBook.source ? `${details.orderBook.source} · snapshot` : "tidak tersedia"}
            bodyClassName=""
          >
            <div id="orderbook" className="scroll-mt-28 p-4">
              <div className="grid grid-cols-2 gap-px bg-rule">
                <OrderSide
                  label="Bid terbaik"
                  price={details?.orderBook.bid ?? null}
                  volume={details?.orderBook.bidVolume ?? null}
                  tone="buy"
                />
                <OrderSide
                  label="Offer terbaik"
                  price={details?.orderBook.offer ?? null}
                  volume={details?.orderBook.offerVolume ?? null}
                  tone="sell"
                />
              </div>
              <p className="mt-3 text-micro leading-relaxed text-dim">
                {details?.orderBook.source
                  ? `Best bid/offer dari ${details.orderBook.source}, data tertunda; bukan kedalaman pasar real-time.${details.orderBook.asOf ? ` Tanggal perdagangan ${details.orderBook.asOf}.` : ""}`
                  : "Bid/offer valid tidak tersedia dari sumber terhubung. N/D berarti tidak diketahui, bukan antrean kosong."}
              </p>

              <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4 border-t border-rule pt-4">
                <Stat k="Pembukaan" v={formatPrice(details?.quote.open)} />
                <Stat k="Tertinggi harian" v={formatPrice(details?.quote.high)} />
                <Stat k="Terendah harian" v={formatPrice(details?.quote.low)} />
                <Stat k="Tertinggi 52 minggu" v={formatPrice(details?.quote.week52High)} />
                <Stat k="Terendah 52 minggu" v={formatPrice(details?.quote.week52Low)} />
                <Stat k="P/E" v={formatRatio(details?.quote.trailingPE)} />
                <Stat k="P/B" v={formatRatio(details?.quote.priceToBook)} />
                <Stat k="Imbal hasil dividen" v={formatOptionalPct(details?.quote.dividendYield)} />
              </dl>
            </div>
          </Panel>
        }
      />

      <div className="grid gap-px xl:grid-cols-[minmax(0,1.25fr)_minmax(22rem,0.75fr)]">
        <Panel
          title="Profil Perusahaan"
          meta={details?.sources.join(" · ") ?? "hanya katalog"}
          bodyClassName=""
        >
          <div className="space-y-5 p-5">
            <div className="flex items-start gap-3">
              <Building2 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-amber" />
              <div>
                <h3 className="text-sm font-semibold text-ink-hi">{fresh.name}</h3>
                <p className="mt-2 max-w-4xl text-sm leading-6 text-dim">
                  {companySummaryId({ name: fresh.name, code: fresh.code, sector: details?.sector ?? fresh.sector, marketCap: fresh.marketCap, isListed: fresh.isListed })}
                </p>
                {details?.summary && <details className="mt-3 max-w-4xl border-l-2 border-rule-hi pl-3 text-xs text-dim"><summary className="cursor-pointer text-cyan">Uraian kegiatan usaha dari sumber asli</summary><p className="mt-2 whitespace-pre-line leading-relaxed">{details.summary}</p></details>}
              </div>
            </div>

            <div className="grid gap-px bg-rule sm:grid-cols-2 lg:grid-cols-4">
              <Fact icon={Landmark} label="Papan pencatatan" value={details?.listingBoard ?? "—"} />
              <Fact icon={Building2} label="Tanggal pencatatan" value={formatDate(details?.listingDate)} />
              <Fact icon={Users} label="Karyawan" value={formatVolume(details?.employees)} />
              <Fact icon={Globe2} label="Sektor" value={details?.sector ?? fresh.sector ?? "—"} />
            </div>

            <dl className="grid grid-cols-2 gap-x-8 gap-y-4 border-t border-rule pt-4 sm:grid-cols-4">
              <Stat k="Saham beredar" v={formatVolume(details?.quote.sharesOutstanding)} />
              <Stat k="Saham publik" v={formatVolume(details?.quote.floatShares)} />
              <Stat k="Industri" v={details?.industry ?? "—"} />
              <Stat k="Alamat" v={details?.address ?? "—"} />
            </dl>

            {safeWebsite(details?.website) && (
              <a
                href={safeWebsite(details?.website) ?? undefined}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-amber hover:underline"
              >
                Situs resmi perusahaan
                <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </Panel>

        <Panel
          title="Struktur Pemegang Saham"
          meta={details?.ownership.asOf ? `KSEI ${details.ownership.asOf}` : "tidak tersedia"}
          bodyClassName=""
        >
          <div className="p-5">
            <OwnershipBar
              local={details?.ownership.localPct ?? null}
              foreign={details?.ownership.foreignPct ?? null}
              other={details?.ownership.unrecordedPct ?? null}
            />
            <dl className="mt-5 grid grid-cols-2 gap-4">
              <Stat k="Kepemilikan lokal" v={formatPlainPct(details?.ownership.localPct)} />
              <Stat k="Kepemilikan asing" v={formatPlainPct(details?.ownership.foreignPct)} />
              <Stat k="Kepemilikan internal" v={formatPlainPct(details?.ownership.insidersPct)} />
              <Stat k="Kepemilikan institusi" v={formatPlainPct(details?.ownership.institutionsPct)} />
            </dl>
            <p className="mt-4 text-micro leading-relaxed text-dimmer">
              Persentase lokal/asing berasal dari efek tanpa warkat KSEI, bukan saham beredar bebas.
              Bagian belum tercatat mencakup efek di luar snapshot tersebut.
            </p>

            <ShareholderList holders={namedShareholders} />
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
      <p className={`mt-2 text-xl font-bold ${price == null ? "text-dim" : tone === "buy" ? "text-up" : "text-down"}`}>
        {price == null || price <= 0 ? "N/D" : formatPrice(price)}
      </p>
      <p className="mt-1 text-xs text-dim">Volume {volume == null || volume <= 0 ? "N/D" : formatVolume(volume)}</p>
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
    return <p className="text-sm text-dim">Snapshot kepemilikan belum tersedia.</p>;
  }
  return (
    <div>
      <div className="flex h-3 overflow-hidden bg-void" aria-label="Komposisi kepemilikan">
        <span className="bg-amber" style={{ width: `${Math.max(0, local ?? 0)}%` }} />
        <span className="bg-sky-400" style={{ width: `${Math.max(0, foreign ?? 0)}%` }} />
        <span className="bg-rule-hi" style={{ width: `${Math.max(0, other ?? 0)}%` }} />
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-micro text-dimmer">
        <Legend color="bg-amber" label="Lokal" />
        <Legend color="bg-sky-400" label="Asing" />
        <Legend color="bg-rule-hi" label="Belum tercatat" />
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
  return value == null || !Number.isFinite(value) ? "—" : `${value.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}x`;
}

function financialValue(value: number | null | undefined, currency: string | null | undefined) {
  if (value == null || !Number.isFinite(value) || !currency || !/^[A-Z]{3}$/.test(currency)) return "N/D";
  if (currency === "IDR") return formatValue(value);
  const abs = Math.abs(value);
  if (abs >= 1e12) return `${currency} ${(value / 1e12).toLocaleString("id-ID", { maximumFractionDigits: 2 })} triliun`;
  if (abs >= 1e9) return `${currency} ${(value / 1e9).toLocaleString("id-ID", { maximumFractionDigits: 2 })} miliar`;
  if (abs >= 1e6) return `${currency} ${(value / 1e6).toLocaleString("id-ID", { maximumFractionDigits: 2 })} juta`;
  return `${currency} ${new Intl.NumberFormat("id-ID").format(value)}`;
}

function formatOptionalPct(value: number | null | undefined) {
  return value == null || !Number.isFinite(value) ? "—" : `${(value * 100).toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

function formatPlainPct(value: number | null | undefined) {
  return value == null || !Number.isFinite(value) ? "—" : `${value.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
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
