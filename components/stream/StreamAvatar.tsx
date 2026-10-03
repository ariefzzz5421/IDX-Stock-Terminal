import Image from "next/image";

export function StreamAvatar({ url, name, size = 42 }: { url: string | null; name: string; size?: number }) {
  return url
    ? <Image src={url} alt="" width={size} height={size} unoptimized className="shrink-0 rounded-full border border-rule-hi object-cover" style={{ width: size, height: size }} />
    : <span aria-hidden="true" className="grid shrink-0 place-items-center rounded-full border border-amber/50 bg-amber/10 font-display font-bold text-amber" style={{ width: size, height: size }}>{name.slice(0, 1).toUpperCase()}</span>;
}
