import { foreignFlowLeaders } from "@/lib/foreign-flow";

export const dynamic = "force-dynamic";

export async function GET() {
  const flow = await foreignFlowLeaders(10);
  return Response.json(flow, {
    status: flow.available ? 200 : 503,
    headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=600" },
  });
}
