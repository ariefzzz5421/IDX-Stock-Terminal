/** Compact, self-contained SVG avatars. No image host or paid generator needed. */
const STYLES = [
  { name: "Orbit", bg: "#17253b", accent: "#55c7ec", second: "#f6aa37" },
  { name: "Ember", bg: "#30201e", accent: "#f6aa37", second: "#ea6d5d" },
  { name: "Signal", bg: "#142c29", accent: "#60d3b0", second: "#b3d979" },
  { name: "Nova", bg: "#27213a", accent: "#b7a5fc", second: "#e78bc1" },
  { name: "Tide", bg: "#153342", accent: "#79d6e1", second: "#6d9ff2" },
  { name: "Copper", bg: "#32271d", accent: "#e8a36d", second: "#f4d06d" },
  { name: "Vector", bg: "#252c1d", accent: "#b5d978", second: "#75d0bc" },
  { name: "Pulse", bg: "#331d33", accent: "#ec92cb", second: "#ecad5d" },
] as const;

export function avatarPresets(username: string) {
  const initials = username.slice(0, 2).toUpperCase().replace(/[^A-Z0-9_]/g, "");
  return STYLES.map((style, index) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" fill="${style.bg}"/><path d="M0 20h80M0 40h80M0 60h80M20 0v80M40 0v80M60 0v80" stroke="${style.accent}" stroke-opacity=".12"/><path d="M8 ${60 - index * 3}L40 9l32 ${51 + index * 3}" fill="none" stroke="${style.second}" stroke-opacity=".42" stroke-width="2"/><rect x="13" y="13" width="54" height="54" rx="8" fill="${style.bg}" stroke="${style.accent}" stroke-width="2"/><circle cx="40" cy="39" r="20" fill="${style.accent}" fill-opacity=".16"/><text x="40" y="48" text-anchor="middle" font-family="monospace" font-size="22" font-weight="700" fill="${style.accent}">${initials}</text><path d="M18 63h12m20 0h12" stroke="${style.second}" stroke-width="3"/></svg>`;
    return { name: style.name, url: `data:image/svg+xml,${encodeURIComponent(svg)}` };
  });
}
