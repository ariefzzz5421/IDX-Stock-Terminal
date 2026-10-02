export const TRENDING_EXTENSION_COOKIE = "idx-trending-extension";

export function setTrendingExtensionEnabled(enabled: boolean) {
  document.cookie = `${TRENDING_EXTENSION_COOKIE}=${enabled ? "on" : "off"}; Path=/; Max-Age=31536000; SameSite=Lax`;
}
