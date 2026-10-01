/** Curated local character portraits. Existing uploaded and legacy avatars stay valid. */
export const avatarPresets = [
  { name: "Adi", url: "/avatars/character-adi.png" },
  { name: "Naya", url: "/avatars/character-naya.png" },
  { name: "Bima", url: "/avatars/character-bima.png" },
  { name: "Tara", url: "/avatars/character-tara.webp" },
  { name: "Raka", url: "/avatars/character-raka.webp" },
  { name: "Mira", url: "/avatars/character-mira.webp" },
  { name: "Jaya", url: "/avatars/character-jaya.webp" },
  { name: "Nova", url: "/avatars/character-nova.webp" },
  { name: "Sari", url: "/avatars/character-sari.webp" },
] as const;

export function isPresetAvatar(value: string) {
  return avatarPresets.some((preset) => preset.url === value);
}
