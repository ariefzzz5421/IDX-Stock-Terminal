import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { Panel } from "@/components/terminal/Panel";
import { StockTable } from "@/components/terminal/StockTable";
import { BoardSearch } from "@/components/terminal/BoardSearch";
import { STOCK_SELECT, boardCounts } from "@/lib/stocks";
import { getMarketActivity } from "@/lib/market-data/trending";
import { withMarketSnapshot } from "@/lib/market-data/boards";

export const metadata: Metadata = { title: "Market — IDX Terminal" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export default async function MarketPage({
  searchParams,
}: PageProps<"/market">) {
  await requireUser();

  const params = await searchParams;
  const query = (typeof params.q === "string" ? params.q : "").trim().slice(0, 64);
  const requestedPage = Number(params.page ?? 1);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  // SQLite's LIKE is case-insensitive for ASCII by default. PostgreSQL needs
  // Prisma's explicit mode, which is absent from the SQLite-generated type.
  const nameFilter = process.env.DATABASE_URL?.startsWith("postgres")
    ? { contains: query, mode: "insensitive" }
    : { contains: query };

  // Codes are short and uppercase; names are long. Matching both means "BBCA"
  // and "bank central" each find the same row.
  const where = query
    ? {
        isListed: true,
        OR: [
          { code: { contains: query.toUpperCase() } },
          { name: nameFilter as { contains: string } },
        ],
      }
    : { isListed: true };

  const [rows, matching, counts, activity] = await Promise.all([
    prisma.stock.findMany({
      where,
      orderBy: [{ marketCap: "desc" }, { code: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: STOCK_SELECT,
    }),
    prisma.stock.count({ where }),
    boardCounts(),
    getMarketActivity(),
  ]);

  const pages = Math.max(1, Math.ceil(matching / PAGE_SIZE));

  return (
    <Panel
      title="Market"
      meta={`${counts.total} listed · ${activity.allStocks.length ? `${activity.allStocks.length} delayed snapshot rows` : `${counts.quoted} stored quotes`}`}
    >
      <div className="border-b border-rule bg-panel-hi px-4 py-3">
        <BoardSearch initialQuery={query} />
        <p className="mt-2 text-micro text-dimmer">
          Saham tercatat BEI dari profil bursa 30 September 2026, diurutkan
          berdasarkan kapitalisasi pasar yang tersedia. {activity.allStocks.length
            ? "Harga dan aktivitas memakai snapshot pasar bila tersedia."
            : "Umpan pasar tidak tersedia; harga tersimpan mungkin sudah usang."}
        </p>
      </div>

      <StockTable
        rows={withMarketSnapshot(rows, activity)}
        extra="marketCap"
        emptyMessage={
          page > pages
            ? "Page di luar hasil yang tersedia. Kembali ke halaman sebelumnya."
            : query
            ? `Tidak ada saham yang cocok dengan “${query}”.`
            : "Daftar saham belum terisi."
        }
      />

      {pages > 1 && (
        <nav
          aria-label="Halaman hasil"
          className="flex items-center justify-between gap-3 border-t border-rule bg-panel-hi px-4 py-2.5 text-xs"
        >
          <PageLink
            page={page - 1}
            query={query}
            disabled={page <= 1}
            label="← Sebelumnya"
          />
          <span className="text-dim">
            {matching.toLocaleString("id-ID")} hasil · halaman {page} dari {pages}
          </span>
          <PageLink
            page={page + 1}
            query={query}
            disabled={page >= pages}
            label="Berikutnya →"
          />
        </nav>
      )}
    </Panel>
  );
}

function PageLink({
  page,
  query,
  disabled,
  label,
}: {
  page: number;
  query: string;
  disabled: boolean;
  label: string;
}) {
  if (disabled) {
    return <span className="px-2 py-1 text-dimmer">{label}</span>;
  }

  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (page > 1) params.set("page", String(page));

  return (
    <Link
      href={`/market${params.size ? `?${params}` : ""}`}
      className="border border-rule-hi px-2.5 py-1 text-dim transition-colors hover:border-amber hover:text-amber"
    >
      {label}
    </Link>
  );
}
