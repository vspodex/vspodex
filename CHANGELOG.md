# Changelog

All notable changes to this project will be documented in this file.


## [0.1.3.0] - 2026-07-01

### Added
- **Custom Sidebar Tab Reordering**:
  - Implemented drag-and-drop tab reordering under General Settings.
  - Sidebar links render dynamically reflecting the user's custom sort order.
- **Default Subscriber-Count Sorting and Subgroups in Members Tab**:
  - Split VSPO followed channels into distinct sub-sections: VSPO JP, VSPO EN, and VSPO Official.
  - Changed default sorting in the Members tab to subscriber count descending (fetched on-demand using the Holodex API).
  - Aligned style of the Members header to match other tabs.
- **Japanese Name Preference Formatting Rule**:
  - Configured `formatChannelName` helper to return only the Japanese/native name if it contains Japanese characters (hiragana, katakana, kanji), falling back to the English name only if no Japanese characters are present.

### Fixed
- **Settings Favorite Toggle Button**:
  - Restored and reordered the favorite star button toggle inside the followed channels rows to display directly before the follow/unfollow button.
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
