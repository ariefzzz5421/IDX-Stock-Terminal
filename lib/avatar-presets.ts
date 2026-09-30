/** Small illustrated character portraits, rendered locally as SVG data URIs. */
const CHARACTERS = [
  { name: "Kucing", back: "#9ed7e8", coat: "#f5a862", dark: "#bd663d", ears: "<path d='M21 34 15 8 37 24M59 34 65 8 43 24'/>" },
  { name: "Beruang", back: "#ecc6a6", coat: "#bb845c", dark: "#80503d", ears: "<circle cx='20' cy='24' r='11'/><circle cx='60' cy='24' r='11'/>" },
  { name: "Kelinci", back: "#d5cbf1", coat: "#f4e5e5", dark: "#be91ab", ears: "<ellipse cx='27' cy='14' rx='8' ry='19' transform='rotate(-14 27 14)'/><ellipse cx='53' cy='14' rx='8' ry='19' transform='rotate(14 53 14)'/>" },
  { name: "Rubah", back: "#f3cf9c", coat: "#ed8c49", dark: "#a24f32", ears: "<path d='M18 35 8 8 37 27M62 35 72 8 43 27'/>" },
  { name: "Panda", back: "#c9dcbf", coat: "#f2f1ed", dark: "#3f4954", ears: "<circle cx='20' cy='22' r='11'/><circle cx='60' cy='22' r='11'/>" },
  { name: "Anjing", back: "#b6d3f0", coat: "#deb987", dark: "#956c51", ears: "<ellipse cx='17' cy='39' rx='12' ry='20' transform='rotate(18 17 39)'/><ellipse cx='63' cy='39' rx='12' ry='20' transform='rotate(-18 63 39)'/>" },
  { name: "Koala", back: "#d7d9e9", coat: "#a8abbc", dark: "#686f84", ears: "<circle cx='17' cy='33' r='15'/><circle cx='63' cy='33' r='15'/>" },
  { name: "Harimau", back: "#f0d49d", coat: "#eda445", dark: "#8b5234", ears: "<path d='M19 31 16 13 35 25M61 31 64 13 45 25'/>" },
] as const;

export function avatarPresets(username: string) {
  const initials = username.slice(0, 2).toUpperCase().replace(/[^A-Z0-9]/g, "") || "ID";
  return CHARACTERS.map((character, index) => {
    const prefix = `animal-${index}`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 80 80" role="img" aria-label="${character.name}">
      <defs><radialGradient id="bg-${prefix}" cx="38%" cy="25%"><stop stop-color="#fff" stop-opacity=".8"/><stop offset="1" stop-color="${character.back}"/></radialGradient><radialGradient id="fur-${prefix}" cx="34%" cy="24%"><stop stop-color="#fff" stop-opacity=".55"/><stop offset=".55" stop-color="${character.coat}"/><stop offset="1" stop-color="${character.dark}"/></radialGradient><filter id="shadow-${prefix}"><feDropShadow dx="0" dy="3" stdDeviation="2" flood-color="#283143" flood-opacity=".3"/></filter></defs>
      <rect width="80" height="80" rx="13" fill="url(#bg-${prefix})"/><ellipse cx="40" cy="77" rx="29" ry="8" fill="#283143" opacity=".16"/>
      <g fill="${character.dark}" filter="url(#shadow-${prefix})">${character.ears}</g>
      <ellipse cx="40" cy="43" rx="29" ry="27" fill="url(#fur-${prefix})" stroke="${character.dark}" stroke-opacity=".35"/>
      <ellipse cx="40" cy="54" rx="17" ry="12" fill="#fff7ec" fill-opacity=".8"/>
      <ellipse cx="29" cy="40" rx="3" ry="4" fill="#26303b"/><ellipse cx="51" cy="40" rx="3" ry="4" fill="#26303b"/><circle cx="30" cy="39" r="1" fill="white"/><circle cx="52" cy="39" r="1" fill="white"/>
      <path d="M36 50q4-4 8 0l-4 4z" fill="${character.dark}"/><path d="M40 54q-3 5-7 1m7-1q3 5 7 1" fill="none" stroke="${character.dark}" stroke-width="1.6" stroke-linecap="round"/>
      <circle cx="21" cy="49" r="4" fill="#f08989" opacity=".35"/><circle cx="59" cy="49" r="4" fill="#f08989" opacity=".35"/>
      <rect x="24" y="67" width="32" height="10" rx="5" fill="#273247" opacity=".85"/><text x="40" y="74.5" text-anchor="middle" font-family="monospace" font-size="7" font-weight="700" fill="white">${initials}</text>
    </svg>`;
    return { name: character.name, url: `data:image/svg+xml,${encodeURIComponent(svg)}` };
  });
}
