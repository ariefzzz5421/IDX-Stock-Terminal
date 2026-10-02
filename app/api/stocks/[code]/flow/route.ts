import { getCompanyCatalogEntry } from "@/lib/company-catalog";
import { getLatestIdxStockSummary } from "@/lib/market-data/idx-official";

export async function GET(_request: Request, { params }: RouteContext<"/api/stocks/[code]/flow">) {
  const { code: raw } = await params;
  const code = raw.trim().toUpperCase();
  if (!getCompanyCatalogEntry(code)) return Response.json({ error: "Saham tidak ditemukan." }, { status: 404 });
  const summary = await getLatestIdxStockSummary();
  const row = summary.rows.find((item) => item.code === code);
  if (!summary.available || !row || row.foreignNet === null) {
    return Response.json({ available: false, date: summary.date, source: "BEI" }, { headers: { "Cache-Control": "private, max-age=300" } });
  }
  return Response.json({
    available: true, date: summary.date, source: "BEI",
    netShares: row.foreignNet,
    estimatedNetValue: row.close === null ? null : row.foreignNet * row.close,
  }, { headers: { "Cache-Control": "private, max-age=300" } });
}
