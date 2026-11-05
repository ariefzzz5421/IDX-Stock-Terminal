/**
 * Satori/Next ImageResponse does not inherit next/font from the web layout.
 * Fetch the SIL OFL Oswald Bold webfont once per server instance.
 * Keep the existing system-font fallback if CDN access is unavailable:
 * market alerts must never be dropped because of a decorative font.
 *
 * Font: Oswald by Vernon Adams / Cyreal / Kalapi Gajjar.
 * License: SIL Open Font License 1.1 (https://openfontlicense.org/).
 * CDN artifact pinned to @fontsource/oswald 5.2.8.
 */
const OSWALD_URL =
  "https://cdn.jsdelivr.net/npm/@fontsource/oswald@5.2.8/files/oswald-latin-700-normal.woff";

let oswaldPromise: Promise<ArrayBuffer | null> | undefined;

async function fetchOswald(): Promise<ArrayBuffer | null> {
  try {
    const response = await fetch(OSWALD_URL, {
      cache: "force-cache",
      signal: AbortSignal.timeout(3200),
    });
    if (!response.ok) return null;
    const bytes = await response.arrayBuffer();
    if (bytes.byteLength < 2000 || bytes.byteLength > 90000) return null;
    const signature = new TextDecoder().decode(bytes.slice(0, 4));
    if (signature !== "wOFF") return null;
    return bytes;
  } catch {
    return null;
  }
}

export function loadOswaldBold(): Promise<ArrayBuffer | null> {
  return (oswaldPromise ??= fetchOswald());
}
