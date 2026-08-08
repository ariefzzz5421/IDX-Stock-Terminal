import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { Panel } from "@/components/terminal/Panel";
import { StockTable } from "@/components/terminal/StockTable";
import { BoardSearch } from "@/components/terminal/BoardSearch";
import { STOCK_SELECT, boardCounts } from "@/lib/stocks";

export const metadata: Metadata = { title: "Market — IDX Terminal" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export default async function MarketPage({
  searchParams,
}: PageProps<"/market">) {
  await requireUser();

  const params = await searchParams;
  const query = (typeof params.q === "string" ? params.q : "").trim();
  const page = Math.max(1, Number(params.page ?? 1) || 1);

  // Codes are short and uppercase; names are long. Matching both means "BBCA"
  // and "bank central" each find the same row.
  const where = query
    ? {
        OR: [
          { code: { contains: query.toUpperCase() } },
          { name: { contains: query, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [rows, matching, counts] = await Promise.all([
    prisma.stock.findMany({
      where,
      orderBy: [{ marketCap: "desc" }, { code: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: STOCK_SELECT,
    }),
    prisma.stock.count({ where }),
    boardCounts(),
  ]);

  const pages = Math.max(1, Math.ceil(matching / PAGE_SIZE));

  return (
    <Panel
      title="Market"
      meta={`${counts.total} listed · ${counts.quoted} quoted`}
    >
      <div className="border-b border-rule bg-panel-hi px-4 py-3">
        <BoardSearch initialQuery={query} />
        <p className="mt-2 text-micro text-dimmer">
          Active IDX equity securities from the latest KSEI master snapshot,
          ranked by market capitalisation. Prices are fetched for your watchlist
          and the largest names, so illiquid or suspended securities may have no quote.
        </p>
      </div>

      <StockTable
        rows={rows}
        extra="marketCap"
        emptyMessage={
          query
            ? `Nothing matches “${query}”.`
            : "The board is empty — run `npm run db:seed`."
        }
      />

      {pages > 1 && (
        <nav
          aria-label="Pagination"
          className="flex items-center justify-between gap-3 border-t border-rule bg-panel-hi px-4 py-2.5 text-xs"
        >
          <PageLink
            page={page - 1}
            query={query}
            disabled={page <= 1}
            label="← Prev"
          />
          <span className="text-dim">
            {matching.toLocaleString("en-US")} results · page {page} of {pages}
          </span>
          <PageLink
            page={page + 1}
            query={query}
            disabled={page >= pages}
            label="Next →"
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
