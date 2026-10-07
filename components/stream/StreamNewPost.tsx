"use client";

import { useState } from "react";
import { SquarePen, X } from "lucide-react";
import { StreamComposer } from "./StreamFeed";

export function StreamNewPost({ stocks, canPost, username }: { stocks: { code: string; name: string }[]; canPost: boolean; username: string }) {
  const [open, setOpen] = useState(false);
  return <section className="space-y-3">
    <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="inline-flex min-h-11 items-center gap-2 border border-amber bg-amber px-4 text-xs font-bold uppercase text-void hover:bg-amber/90">
      {open ? <X className="h-4 w-4" /> : <SquarePen className="h-4 w-4" />}{open ? "Tutup" : "New Post"}
    </button>
    {open && <div id="stream-new-post"><StreamComposer stocks={stocks} canPost={canPost} username={username} onPosted={() => setOpen(false)} /></div>}
  </section>;
}
