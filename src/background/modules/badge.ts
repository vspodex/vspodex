import { stores } from "~/common/stores";

export async function refreshActionBadge(liveCount: number) {
  const settings = await stores.settings.get();

  if (settings.badge.enabled && liveCount > 0) {
    browser.action.setBadgeText({ text: String(liveCount) });
    browser.action.setBadgeBackgroundColor({ color: settings.badge.color });
    if (browser.action.setBadgeTextColor) {
      try {
        browser.action.setBadgeTextColor({ color: "#FFFFFF" });
      } catch (e) {
        // Ignored in browsers that don't support it
      }
    }
  } else {
    browser.action.setBadgeText({ text: "" });
  }
}
