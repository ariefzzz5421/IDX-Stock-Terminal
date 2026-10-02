import type { Metadata } from "next";
import { cookies } from "next/headers";
import { requireUser } from "@/lib/auth/session";
import { TRENDING_EXTENSION_COOKIE } from "@/lib/trending-extension";
import { TrendingExtensionControl } from "@/components/terminal/TrendingExtensionControl";

export const metadata: Metadata = { title: "Extension — IDX Terminal" };

export default async function ExtensionPage() {
  await requireUser();
  const enabled = (await cookies()).get(TRENDING_EXTENSION_COOKIE)?.value === "on";

  return <main className="min-w-0 flex-1 bg-panel px-4 py-6 sm:px-6">
    <div className="mx-auto max-w-4xl">
      <p className="text-micro font-semibold uppercase tracking-[0.16em] text-amber">Terminal / personalisasi</p>
      <h1 className="mt-2 flex items-center gap-2 font-display text-2xl font-bold text-ink-hi">Extension</h1>
      <p className="mb-6 mt-2 text-sm text-dim">Pilih panel tambahan yang ingin tampil saat menggunakan terminal.</p>
      <TrendingExtensionControl key={enabled ? "on" : "off"} initialEnabled={enabled} />
    </div>
  </main>;
}
