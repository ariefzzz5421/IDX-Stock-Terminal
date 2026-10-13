export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(
    { available: false, status: "coming_soon", message: "Data arus beli dan jual asing harian belum tersedia." },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}
