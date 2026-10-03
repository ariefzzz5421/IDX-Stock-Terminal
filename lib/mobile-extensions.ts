export const WATCHLIST_EXTENSION_COOKIE = "idx-watchlist-extension";
export const VOLUME_EXTENSION_COOKIE = "idx-volume-extension";

export function setMobileExtensionEnabled(cookieName: string, enabled: boolean) {
  document.cookie = `${cookieName}=${enabled ? "on" : "off"}; Path=/; Max-Age=31536000; SameSite=Lax`;
}
