import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BusinessWorkspace } from "@/components/business-map/BusinessWorkspace";
import { BUSINESS_LOCATIONS } from "@/data/business-locations";
import { NAV_ITEMS } from "@/lib/navigation";
import { missingSettings } from "@/lib/config";

export const metadata: Metadata = { title: "Lokasi Bisnis Preview — IDX Terminal" };
export const dynamic = "force-dynamic";

export default function PreviewLokasiBisnis() {
  if (missingSettings().length === 0) redirect("/lokasi-bisnis");
  return <div className="min-h-screen bg-void"><div className="border-b border-amber/40 bg-amber/10 px-4 py-2 text-xs text-amber">Preview mode · market prices on the main preview are demo/static; geographic company records below are sourced research. <Link href="/preview" className="ml-3 text-cyan hover:underline">← Preview dashboard</Link></div><nav aria-label="Preview terminal sections" className="terminal-nav flex gap-px overflow-x-auto bg-rule">{NAV_ITEMS.map((item) => <Link key={item.href} href={item.href === "/lokasi-bisnis" ? "/preview/lokasi-bisnis" : item.href === "/dashboard" ? "/preview" : item.href} aria-current={item.href === "/lokasi-bisnis" ? "page" : undefined} className={`flex shrink-0 items-center gap-1.5 px-3 py-2 text-xs uppercase ${item.href === "/lokasi-bisnis" ? "bg-panel text-amber" : "bg-panel-hi text-dim"}`}><item.icon className="h-3.5 w-3.5" />{item.shortLabel ?? item.label}</Link>)}</nav><BusinessWorkspace locations={BUSINESS_LOCATIONS} preview /></div>;
}
