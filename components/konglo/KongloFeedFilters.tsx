"use client";

import { Search } from "lucide-react";

export function KongloFeedFilters({ profiles, selected, query }: { profiles: { slug: string; name: string }[]; selected?: string; query: string }) {
  return <form action="/konglo/feed" method="get" role="search" className="grid gap-2 border-b border-rule bg-panel-hi p-4 sm:grid-cols-[minmax(0,1fr)_minmax(13rem,19rem)_auto] sm:px-6">
    <label className="flex min-w-0 items-center gap-2 border border-rule-hi bg-panel px-3"><Search aria-hidden="true" className="h-4 w-4 shrink-0 text-amber" /><input type="search" name="q" defaultValue={query} placeholder="Cari nama, saham, atau informasi" aria-label="Cari Konglo Feed" className="min-h-10 w-full min-w-0 bg-transparent text-xs text-ink-hi outline-none placeholder:text-dim" /></label>
    <select name="person" defaultValue={selected ?? ""} aria-label="Pilih nama Konglo" onChange={(event) => event.currentTarget.form?.requestSubmit()} className="min-h-10 min-w-0 border border-rule-hi bg-panel px-3 text-xs text-ink-hi"><option value="">Semua nama Konglo</option>{profiles.map((profile) => <option key={profile.slug} value={profile.slug}>{profile.name}</option>)}</select>
    <button type="submit" className="min-h-10 border border-amber px-4 text-xs font-bold text-amber hover:bg-amber hover:text-panel">Cari</button>
  </form>;
}
