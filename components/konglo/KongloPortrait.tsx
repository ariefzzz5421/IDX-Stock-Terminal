"use client";

import Image from "next/image";
import { useState } from "react";
import { KONGLO_PHOTOS } from "@/lib/konglo-photos";

export function KongloPortrait({ slug, name, size = 44 }: { slug: string; name: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  const photo = KONGLO_PHOTOS[slug];
  const initials = name.replace(/^(Keluarga|The family of)\s+/i, "").split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  return <span className="inline-grid shrink-0 place-items-center overflow-hidden rounded-full border border-rule-hi bg-panel-hi font-display text-xs font-bold text-amber" style={{ width: size, height: size }} title={photo ? `Foto: ${photo.credit}` : `Foto ${name} belum tersedia`}>
    {photo && !failed ? <Image src={photo.url} alt={photo.credit.includes(" · ") ? `Foto ${photo.credit.split(" · ")[1]} untuk ${name}` : `Foto ${name}`} width={size} height={size} unoptimized loading="lazy" className="h-full w-full object-cover" onError={() => setFailed(true)} /> : <span aria-label={`Foto ${name} belum tersedia`}>{initials}</span>}
  </span>;
}
