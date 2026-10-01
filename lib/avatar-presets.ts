/** Curated local character portraits. Existing uploaded and legacy avatars stay valid. */
export const avatarPresets = [
  { name: "Adi", url: "/avatars/character-adi.png" },
  { name: "Naya", url: "/avatars/character-naya.png" },
  { name: "Bima", url: "/avatars/character-bima.png" },
] as const;

export function isPresetAvatar(value: string) {
  return avatarPresets.some((preset) => preset.url === value);
}
