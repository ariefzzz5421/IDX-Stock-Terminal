/** SVG from allowlisted logo hosts only. Block active/external content. */
export function safeLogoSvg(svg: string): boolean {
  const trimmed = svg.replace(/^\uFEFF/, "").trim();
  if (!/<svg(?:\s|>)/i.test(trimmed) || trimmed.length > 120_000) return false;
  // Restrict external references and active content before sending to Satori.
  if (/<\s*(?:script|foreignObject|iframe|object|embed|image|use|a)\b/i.test(trimmed)) return false;
  if (/\bon\w+\s*=|@import|<\?xml-stylesheet|<!DOCTYPE|<!ENTITY/i.test(trimmed)) return false;
  if (/\b(?:href|xlink:href)\s*=|url\s*\(\s*['"]?\s*(?:https?:|data:|\/\/)/i.test(trimmed)) return false;
  return true;
}

