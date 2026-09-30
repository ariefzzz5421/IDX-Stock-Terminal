import { redirect } from "next/navigation";

export default async function LegacyStockPage({ params }: PageProps<"/stock/[code]">) {
  const { code } = await params;
  redirect(`/asset/${encodeURIComponent(code.toUpperCase())}`);
}
