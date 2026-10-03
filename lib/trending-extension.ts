export const TRENDING_EXTENSION_COOKIE = "idx-trending-extension";
export const TRENDING_DOCK_COOKIE = "idx-trending-dock";

export function setTrendingExtensionEnabled(enabled: boolean) {
  document.cookie = `${TRENDING_EXTENSION_COOKIE}=${enabled ? "on" : "off"}; Path=/; Max-Age=31536000; SameSite=Lax`;
  if (enabled) setTrendingDockMinimized(true);
}

export function setTrendingDockMinimized(minimized: boolean) {
  document.cookie = `${TRENDING_DOCK_COOKIE}=${minimized ? "minimized" : "open"}; Path=/; Max-Age=31536000; SameSite=Lax`;
}
