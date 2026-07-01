# Changelog

All notable changes to this project will be documented in this file.

## [0.1.2.14] - 2026-07-01

### Fixed
- **Firefox Channel Name Mismatch — Migration for Existing Installs**:
  - Existing installs retained a corrupted `channelCache` in `browser.storage.local` from before the `0.1.2.12` fix. The `defaultsDeep` positional-merge corruption persisted across the update, so the wrong member name (e.g. Asumi Sena) continued appearing on Tachibana Hinano's Twitch stream card.
  - Added a one-time migration in `onInstalled` (`reason === "update"`) that resets `channelCache` to the clean `DEFAULT_VSPO_CHANNELS` default, then immediately re-fetches from the Holodex API via `refreshVspoChannels()`. This flushes the corrupted stored array and repopulates it correctly on the first run after updating.

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
