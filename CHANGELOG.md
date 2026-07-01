# Changelog

All notable changes to this project will be documented in this file.


## [0.1.3.1] - 2026-07-01

### Added
- **Compact Favorites Grid Layout**:
  - Render followed favorited channels in a packed 5-in-a-row layout in the Members tab, hiding names to save space.
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
