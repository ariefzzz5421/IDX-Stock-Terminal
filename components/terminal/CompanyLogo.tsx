import Image from "next/image";
import { resolveLogo } from "@/lib/logos";

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
  for (let index = 0; index < code.length; index++) {
    hash ^= code.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return PALETTE[(hash >>> 0) % PALETTE.length];
}

type Size = "sm" | "md" | "lg";

const SIZES: Record<Size, { box: string; text: string; pixels: number }> = {
  sm: { box: "h-6 w-6", text: "text-[9px]", pixels: 24 },
  md: { box: "h-8 w-8", text: "text-[11px]", pixels: 32 },
  lg: { box: "h-12 w-12", text: "text-base", pixels: 48 },
};

/**
 * The logo tile that sits beside a ticker everywhere in the terminal.
 *
 * Order of preference: a manual override from data/logo-overrides.json, then
 * the bundled catalogue, then a monogram coloured from the ticker itself. The
 * monogram means a missing logo still reads as a distinct row rather than a
 * broken image, and it never 404s.
 */
export function CompanyLogo({
  code,
  logoUrl,
  size = "sm",
}: {
  code: string;
  logoUrl?: string | null;
  size?: Size;
}) {
  const { box, text, pixels } = SIZES[size];
  const logo = resolveLogo(code, logoUrl);

  if (logo) {
    const className = `${box} shrink-0 border border-rule bg-white object-contain p-0.5`;

    // Arbitrary hosts skip next/image so a URL pasted into the overrides file
    // works immediately, with no next.config change required.
    return logo.optimised ? (
      <Image
        src={logo.url}
        alt={`${code} company logo`}
        width={pixels}
        height={pixels}
        className={className}
      />
    ) : (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logo.url}
        alt={`${code} company logo`}
        width={pixels}
        height={pixels}
        loading="lazy"
        className={className}
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
