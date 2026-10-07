import Link from "next/link";
import { Users, Rss } from "lucide-react";

export function StreamTabs({ active }: { active: "feed" | "friends" }) {
  return <nav aria-label="Halaman Stream" className="flex gap-2 border-b border-rule pb-2">
    <Link href="/stream" aria-current={active === "feed" ? "page" : undefined} className={`inline-flex min-h-10 items-center gap-2 border px-3 text-xs font-bold ${active === "feed" ? "border-amber text-amber" : "border-rule-hi text-ink hover:text-cyan"}`}><Rss className="h-4 w-4" /> Feed</Link>
    <Link href="/stream/friends" aria-current={active === "friends" ? "page" : undefined} className={`inline-flex min-h-10 items-center gap-2 border px-3 text-xs font-bold ${active === "friends" ? "border-amber text-amber" : "border-rule-hi text-ink hover:text-cyan"}`}><Users className="h-4 w-4" /> Friends</Link>
  </nav>;
}
