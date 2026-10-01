import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BusinessWorkspace } from "@/components/business-map/BusinessWorkspace";
import { BUSINESS_LOCATIONS } from "@/data/business-locations";
import { Nav } from "@/components/terminal/Nav";
import { missingSettings } from "@/lib/config";

export const metadata: Metadata = { title: "Pratinjau Lokasi Bisnis — IDX Terminal" };
export const dynamic = "force-dynamic";

export default function PreviewLokasiBisnis() {
  if (missingSettings().length === 0) redirect("/lokasi-bisnis");
  return <div className="min-h-screen bg-void"><div className="border-b border-amber/40 bg-amber/10 px-4 py-2 text-xs text-amber">Mode pratinjau · harga pasar di pratinjau utama adalah angka contoh; data lokasi perusahaan di bawah berasal dari riset bersumber. <Link href="/preview" className="ml-3 text-cyan hover:underline">← Beranda pratinjau</Link></div><Nav preview /><BusinessWorkspace locations={BUSINESS_LOCATIONS} preview /></div>;
}
