# Changelog

All notable changes to this project will be documented in this file.

## [0.1.2.10] - 2026-05-21

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
