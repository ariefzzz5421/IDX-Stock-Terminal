import { prisma } from "@/lib/db/prisma";
import { routeErrorResponse } from "@/lib/db/errors";
import { getCompanyCatalogEntry } from "@/lib/company-catalog";
import { getCompanyDetails } from "@/lib/market-data/company-details";
import { ensureStockCatalog } from "@/lib/stocks";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/stocks/[code]">,
) {
  const { code: raw } = await params;
  const code = raw.trim().toUpperCase();
  const catalog = getCompanyCatalogEntry(code);
  if (!catalog) {
    return Response.json({ error: `${code} is not an active IDX equity security.` }, { status: 404 });
  }

  try {
    await ensureStockCatalog();
    const [stock, details] = await Promise.all([
      prisma.stock.findUnique({ where: { code } }),
      getCompanyDetails(code),
    ]);
    return Response.json(
      { stock, catalog, details },
      { headers: { "Cache-Control": "private, max-age=60, stale-while-revalidate=300" } },
    );
  } catch (error) {
    return routeErrorResponse(error, `stock endpoint ${code}`);
  }
}
