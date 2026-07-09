# Changelog

All notable changes to this project will be documented in this file.


## [0.1.3.9] - 2026-07-08

### Fixed
- **Streak Tracking Overwrite on Stream Offline Event**:
  - Fixed a race condition where the newly cycled stream in streak mode was overwritten and removed from the `autoOpenedStreams` store during the offline check in the background refresh loop.

## [0.1.3.8] - 2026-07-08

### Fixed
- **Auto-Open Delayed & Gorilla Streams**:
  - Refined the background Sleep Guard logic. Instead of comparing stream start times directly, we check if the extension was awake and actively refreshing. If awake, we bypass the start-time check for all newly detected live favorite streams, allowing delayed or guerrilla streams to open immediately without being filtered as stale.

## [0.1.3.7] - 2026-07-08

### Added
- **Max Stream Streak Option**:
  - Added a dropdown selector under General Settings to configure the maximum number of streams to auto-open in a single viewing streak sequence (1, 2, 3, 5, 10, or Unlimited). Default is set to 3.
  - Implemented background counting and limit validation to automatically stop streak tracking once the threshold is met.
- **Three-State Favorites Trigger**:
  - Implemented a three-state lightning bolt toggle button in the sidebar footer: Disarmed (grey slashed), Armed (yellow transparent outline), and Streak Mode (solid pulsing yellow).
  - Synchronized the sidebar bolt's visual state to glow in Streak Mode when a manual or auto-opened stream is actively being tracked.
  - Added a `"cancelStreakTracking"` listener to cleanly disarm active streak sessions via the sidebar toggle.
- **Manual Streak Tracking**:
  - Added a manual streak bolt button on live stream cards (only visible when the experimental auto-rearm feature is enabled) to open a stream and register it as the active streak target.
  - Added a sub-option configuration in General Settings to automatically open all manually clicked live cards in streak mode.
  - Refined layout padding to ensure card dimensions return to their original layout size when the live card bolt button is disabled in Settings.
- **Sleep & Suspend Grace Guard**:
  - Implemented a start-time grace period check (verifying `startedAt` is within `refreshInterval + 2` minutes of current time) to suppress tab openings for old streams after computer sleep/suspension or offline state recovery.
- **Watchlist Scheduled Streams**:
  - Implemented an alarm toggle button on upcoming stream cards (solid sky blue background when toggled) to open the scheduled stream when its start time is reached.
  - Alarms are registered via the browser alarms API and persist across browser/service worker restarts.
- **Auto-Rearm & Cycle Favorites (Experimental)**:
  - Added an experimental setting to automatically re-arm the auto-open favorites trigger when an auto-opened stream goes offline, cycling automatically to another live favorite if online.
  - Conditionally disarms the auto-open trigger on launch of a watchlist scheduled stream if configured.

### Fixed
- **Manual Open Respecting Click Behavior**:
  - Restored click behavior settings for manual opens under streak mode (both card body clicks and card bolt icon clicks), ensuring they respect target window and tab preferences.
- **Unclickable Cards Fix**:
  - Fixed a bug where live stream cards became completely unclickable when the experimental auto-rearm setting was toggled off.
- **Service Worker Suspension (Manifest V3)**:
  - Fixed first-run initialization checks by storing the safety flag in session storage rather than an in-memory variable, ensuring correct live transition detection after service worker restarts.
- **Twitch Channel ID Mapping**:
  - Unified Twitch live and past streams to map to their corresponding YouTube channel IDs, correcting favoritism filtering for Twitch channels.

## [0.1.3.4] - 2026-07-08

### Added
- **VSPO! Member Color Themes**:
  - Added themes for Kaga Sumire, Kaga Nazuna, Kogara Toto, Ichinose Uruha, Kurumi Noa, Kaminari Kyupi, Yakumo Beni, Aizawa Ema, Asumi Sena, Tosaki Mimi, Nekota Tsuna, Komori Met, Yumeno Akari, Yano Kuromu, and Tsumugi Kokage.
  - Implemented selection under General Settings and custom visual style overrides.
- **Komori Met Theme Customization**:
  - Customized the sidebar navigation background color for Komori Met's theme to a dark ash grey (`#3e3a39`) matching her hair color, ensuring navigation links and icons remain highly readable.

### Fixed
- **Sub-Tab Buttons Background**:
  - Resolved an issue where the YouTube/Twitch sub-tab container on the Past Streams tab retained a white background by mapping `.bg-neutral-50` to the theme-specific sidebar background color.

## [0.1.3.3] - 2026-07-07

### Added
- **Keyboard Shortcuts for Tab Navigation**:
  - Added commands to open the Live, Members, and Past streams tabs without default key shortcuts, allowing users to customize bindings via browser extension settings.
  - Implemented a background command listener that triggers popup opening and a frontend router state sync mechanism that redirects to the requested tab route.
  - Resolved a Chrome-specific constraint requiring synchronous execution of `openPopup` in the keyboard shortcut event stack to preserve user gesture context.

### Fixed
- **Past Stream Display Date**:
  - Resolved an issue where past YouTube streams on member channel pages and the Past Streams tab displayed incorrect ended relative times (e.g. "<1m" or incorrect days/hours). Corrected the fallback logic to use `available_at` directly instead of `published_at` when `start_actual` is null, preventing incorrect stream end time calculations.

## [0.1.3.2] - 2026-07-01

### Fixed
- **Channel Pages Stream Sorting**:
  - Resolved an issue where past Twitch streams were displayed ahead of YouTube streams on member channel pages. Added a fallback to `published_at` and `available_at` in `holodexToUnified` to ensure all past YouTube videos have a valid timestamp for chronological sorting.

## [0.1.3.1] - 2026-07-01

### Added
- **Compact Favorites Grid Layout**:
  - Render followed favorite channels in a packed 5-in-a-row layout in the Members tab, hiding names to save space.
- **Redesigned Member Detail View**:
  - Implemented a premium Holodex-like channel header layout showing primary Japanese/native name first in larger font (`text-lg`), secondary English name second (`text-xs`), and localized subscriber counts.
  - Added a clean top navigation bar with an inline Back button, removing the banner overhead.
  - Enlarged quick-link social buttons (`w-9 h-9`) filled with brand colors for YouTube (red) and Twitch (purple).

### Changed
- **Japanese Name Formatting Refinement**:
  - Filter out leading and trailing prolonged sound mark characters ("ー") from generated Japanese channel names.

---

## [0.1.3.0] - 2026-07-01

### Added
- **New Members Tab**:
  - Introduced a completely new tab listing VSPO members.
  - Divided channels into distinct subgroups: VSPO JP, VSPO EN, and VSPO Official.
  - Set default sorting in the Members tab to subscriber count descending, dynamically fetched using the Holodex API.
  - Aligned the Members header UI styling to match the other existing tabs.
- **Favorite Toggle Button**:
  - Implemented a brand new favorite toggle system.
  - Added a star icon button inside the followed channels rows (positioned directly before the follow/unfollow button) to allow marking channels as favorites.
  - Enabled manual drag-and-drop reordering of favorited channels under settings to customize their display order in the popup.
- **Custom Sidebar Tab Reordering**:
  - Implemented drag-and-drop tab reordering under General Settings.
  - Sidebar links render dynamically reflecting the user's custom sort order.
- **Japanese Name Preference Formatting Rule**:
  - Configured `formatChannelName` helper to return only the Japanese/native name if it contains Japanese characters (hiragana, katakana, kanji), falling back to the English name only if no Japanese characters are present.

### Changed
- **API Key Setup Documentation**:
  - Updated references to the Holodex API key generation button to reflect its actual UI labels across different languages (English: "GET NEW API KEY", Japanese: "新規APIキーを発行する", Traditional Chinese: "取得新API金鑰") in the store description and all README files.

### Fixed
- **Holodex API Key Connection Verification**:
  - Validates API keys against the Holodex API when saved, alerting users of invalid keys.
  - Updates the settings page to show "Not connected" if a key is invalid/unverified and prevents key-reliant requests from being made.

## [0.1.2.17] - 2026-07-01

### Fixed
- **Twitch Channel Name Mismatch (Hinano shows as Sena) — Correct Root Cause & Fix**:
  - Identified shifted/incorrect YouTube channel IDs in the default configuration list (`DEFAULT_VSPO_CHANNELS`), which caused the Twitch handle override mapping to assign `hinanotachiba7` to Asumi Sena.
  - Corrected all 13 core member mappings (YouTube channel IDs and Twitch handles) in `DEFAULT_VSPO_CHANNELS`.
  - Implemented a storage database migration in the background service worker to automatically transition existing user followed channels and cache entries from the old mismatched IDs to the new correct IDs on extension update.

## [0.1.2.16] - 2026-07-01

### Fixed
- Unlisted Firefox release.

## [0.1.2.15] - 2026-07-01

### Fixed
- Unlisted Firefox release version bump due to version validation conflict.

## [0.1.2.14] - 2026-07-01

### Fixed
- **Twitch Channel Name Mismatch (Hinano shows as Sena) — Actual Root Cause**:
  - Root cause identified: the Holodex API returns incorrect or swapped `twitch` logins for some VSPO members. `refreshVspoChannels()` was conditionally overriding the `twitch` field only when it was missing (`!ch.twitch`). If Holodex provided a value — even a wrong one — it was saved as-is, corrupting the `channelCache` and causing the wrong member's name to appear for a given Twitch stream.
  - Fixed: `refreshVspoChannels()` in `holodex.ts` now unconditionally overwrites the `twitch` field from `DEFAULT_VSPO_CHANNELS` for all known VSPO channels. `DEFAULT_VSPO_CHANNELS` is the authoritative source for twitch logins; Holodex is not trusted for this field.
  - The targeted `channelCache` migration from `0.1.2.14` is retained to repair existing corrupt caches on update.

## [0.1.2.13] - 2026-06-30

### Fixed
- Listed Firefox version release.

## [0.1.2.12] - 2026-06-30

### Fixed
- **Firefox-Only Twitch Channel Name Mismatch**:
  - Prevented positional merging of stored arrays in `Store.getState()` with hardcoded defaults via `defaultsDeep`. This fixes an issue where different channel objects inside arrays like `channelCache` had their data corruptly cross-merged by index on reload (e.g. Tachibana Hinano live stream showing under Asumi Sena's name).

## [0.1.2.11] - 2026-05-21

### Added
- **Experimental Twitch Past Broadcasts**:
  - Dedicated "Twitch" sub-tab alongside the default "YouTube" tab under the "Past Streams" view (enabled by default).
  - Background VOD data querying running at the user-configured update interval (`settings.general.pastStreamsRefreshInterval`).
  - Parallel retrieval of past archives (`type: "archive"`) for target Twitch members (`akarindao`, `ramuneshiranami`, and `shinomiya_runa`).
  - Parsing and conversion of Twitch Helix VOD durations from string notation (e.g. `3h15m20s`) to integer seconds.
  - Checkbox in General Settings to toggle experimental Twitch past broadcasts visibility and synchronization.
  - Localized translation keys in English (`en.ts`), Japanese (`ja.ts`), and Traditional Chinese (`zh.ts`).
- **Quality & Stability**:
  - Clean compilation status under strict TypeScript compiler rules (`npm run test`).
  - Workspace type-safety logs documented under `errorlog.md`.

### Changed
- **Popup UI Optimization**:
  - Bypassed infinite scrolling sentinel events and removed manual update triggers from the Twitch past streams tab to protect resource utilization.
