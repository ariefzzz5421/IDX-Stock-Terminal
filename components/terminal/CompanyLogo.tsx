/**
 * A logo tile for a ticker.
 *
 * There is no free, reliable logo source covering 800+ IDX issuers, and a
 * broken image in every row would be worse than none. So the default is a
 * monogram whose colour is derived from the ticker itself — stable across
 * reloads, distinct enough to recognise a row by shape, and it never 404s.
 * If `stocks.logo_url` is set, that wins.
 */

const PALETTE = [
  { bg: "#1d3a5c", fg: "#7cc0f5" },
  { bg: "#1f4438", fg: "#6fdcaa" },
  { bg: "#4a2733", fg: "#ff9aa6" },
  { bg: "#453317", fg: "#ffc46b" },
  { bg: "#33294f", fg: "#b9a3ff" },
  { bg: "#14424a", fg: "#67d5e0" },
  { bg: "#4a3320", fg: "#ffb082" },
  { bg: "#2c3f1e", fg: "#a9d96b" },
  { bg: "#432040", fg: "#f090e0" },
  { bg: "#1b3350", fg: "#8aa9ff" },
];

function paletteFor(code: string) {
  let hash = 2166136261;
  for (let i = 0; i < code.length; i++) {
    hash ^= code.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return PALETTE[(hash >>> 0) % PALETTE.length];
}

type Size = "sm" | "md" | "lg";

const SIZES: Record<Size, { box: string; text: string }> = {
  sm: { box: "h-6 w-6", text: "text-[9px]" },
  md: { box: "h-8 w-8", text: "text-[11px]" },
  lg: { box: "h-12 w-12", text: "text-base" },
};

export function CompanyLogo({
  code,
  logoUrl,
  size = "sm",
}: {
  code: string;
  logoUrl?: string | null;
  size?: Size;
}) {
  const { box, text } = SIZES[size];

  if (logoUrl) {
    return (
      // Arbitrary remote hosts, so plain <img> rather than next/image —
      // no remotePatterns config to keep in sync with the database.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt=""
        className={`${box} shrink-0 border border-rule object-contain bg-void`}
        loading="lazy"
      />
    );
  }

  const { bg, fg } = paletteFor(code);

  return (
    <span
      aria-hidden="true"
      style={{ backgroundColor: bg, color: fg }}
      className={`${box} ${text} grid shrink-0 place-items-center border border-rule font-bold tracking-[0.02em]`}
    >
      {code.slice(0, 2)}
    </span>
  );
}
