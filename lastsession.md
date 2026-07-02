# Last Session Summary (2026-07-01 - Session 4)

### 📋 Overview of the Session
In this session, we resolved a bug where past Twitch streams were sorted ahead of past YouTube streams on member channel pages. We corrected the video mapping logic to fallback from `start_actual` to `published_at` and `available_at` timestamps for YouTube streams, ensuring all videos have valid dates for chronological sorting. We then bumped the version to `0.1.3.2`, updated the changelog and error log, built and signed the Firefox extension as listed on AMO, packaged the Chrome extension, and pushed all commits and git tag `v0.1.3.2` to GitHub.

### 🛠️ Key Changes
- **Time-Order Sorting Fix (`src/background/index.ts`):**
  - Updated `holodexToUnified` to assign `video.start_actual ?? video.published_at ?? video.available_at ?? null` to `startedAt`, ensuring past streams have valid chronological dates.
- **Version Bump (`package.json`, `overrides/chrome/manifest.json`, `overrides/firefox/manifest.json`):**
  - Incrementally bumped the extension version to `0.1.3.2`.
- **Logs and Releases:**
  - Documented the bug details in [errorlog.md](file:///h:/vspodex/vspodex/errorlog.md) and [CHANGELOG.md](file:///h:/vspodex/vspodex/CHANGELOG.md).
  - Executed listed signing (`npx web-ext sign`) for Firefox (`vspodex-0.1.3.2.xpi`) and packaged Chrome zip (`vspodex-chrome-v0.1.3.2.zip`) in `releases/v0.1.3.2/`.
  - Pushed main branch updates and git tag `v0.1.3.2` to GitHub.

---

# Last Session Summary (2026-07-01 - Session 3)

### 📋 Overview of the Session
In this session, we resolved a bug where the settings page incorrectly showed "Connected" even with an invalid or modified Holodex API key. We added validation against the Holodex API, updated the connection status to show "Not connected" if validation fails, and handled invalid key states across settings and popup tabs. We then compiled and signed/packaged the extension as unlisted for version `0.1.2.18`, bumped the version to `0.1.3.0`, and completed the listed signing workflow for Firefox and packaging for Chrome, pushing all updates and tags to GitHub.

### 🛠️ Key Changes
- **Store & Hook Updates (`src/common/stores.ts`, `src/browser/hooks/store.ts`):**
  - Added a persistent `holodexApiKeyVerified` store to track if the configured key is valid.
  - Exposed `useHolodexApiKeyVerified` React hook.
- **Validation Logic & Background Handling (`src/background/`):**
  - Added a `validateHolodexApiKey` function to perform live test requests using the provided key.
  - Registered `validateHolodexApiKey` in background message handlers.
  - Updated `holodexRequest` to automatically mark the key as unverified (`false`) upon receiving 400/401/403 errors, and verified (`true`) on any successful query.
- **UI & Settings Configuration (`src/browser/views/`):**
  - Refactored `handleSaveApiKey` in `ApiKeySettings.tsx` to validate a new key before saving it, throwing an alert if the key is invalid or fails verification.
  - Updated the API key `StatusBadge` in settings to show "Not connected" if a key is present but unverified.
  - Extended channel settings actions (fetching VSPO members, syncing search lists, adding custom channels) in `ChannelSettings.tsx` to verify key validity status beforehand.
  - Configured `LiveStreams.tsx` popup setup check to render the setup panel if the Holodex key is present but invalid (unless Twitch is connected).
- **Localization & Log Files:**
  - Added key verification failure translations in English, Traditional Chinese, and Japanese.
  - Documented the bug details and resolution steps in `errorlog.md` and updated `CHANGELOG.md` with release notes.
- **Deployment & Git Operations:**
  - Bumped version to `0.1.2.18` (for unlisted) and subsequently to `0.1.3.0` (for listed).
  - Signed Firefox extension targets as unlisted (`v0.1.2.18`) and listed (`v0.1.3.0`).
  - Packaged Chrome extension production zip archives for both versions.
  - Staged, committed, and pushed both versions (`v0.1.2.18` and `v0.1.3.0`) along with Git tags to remote repository.

---

# Last Session Summary (2026-07-01)

### Overview
Implemented a new **Members tab** in the popup extension. Displays followed VSPO members and custom channels as circular avatar icons. Clicking a member fetches their past YouTube and Twitch streams on demand and displays them in a merged newest-first list.

### Key Changes

- **`src/background/modules/holodex.ts`**: Added `getChannelPastVideos(channelId, limit)` — fetches past streams for a single channel via Holodex `/videos?channel_id=`.
- **`src/background/modules/twitch.ts`**: Added `getUserByLogin(login)` and `getUserVideosByLogin(login, limit)` — resolves Twitch login → user ID → fetches VODs.
- **`src/background/index.ts`**: Added `getChannelPastStreams` and `getChannelPastTwitchStreams` message handlers. Registered both in `messageHandlers`. These convert API responses to `UnifiedStream[]`.
- **`src/browser/views/popup/MemberStreams.tsx`** [NEW]: Two-state view component:
  - Grid view: circular avatars of followed members grouped by VSPO / Custom.
  - Stream list view: parallel YouTube + Twitch fetch on click, merged by `startedAt` descending, rendered with existing `StreamCard`. Has back button, loading spinner, empty splash.
- **`src/browser/pages/popup.tsx`**: Added `path: "members"` route under `streams` children.
- **`src/browser/components/Sidebar.tsx`**: Added `IconUsers` as 4th sidebar nav link between Past Streams and Settings. Routes to `/streams/members`.
- **Locales (en.ts, ja.ts, zh.ts)**: Added keys: `tooltip_members`, `header_members`, `header_member_streams`, `splash_no_member_streams`, `members_loading`, `members_back`.

### Architecture Notes
- No new stores — stream data is fetched on demand and held in component state only.
- No background polling — fetches fire only on member click.
- Reuses existing `StreamCard`, `UnifiedStream`, `holodexToUnified`, `twitchVideoToUnified`.

### Build Status
- `tsc --noEmit`: ✅ Pass
- `build:chrome`: ✅ Pass
- `build:firefox`: ✅ Pass

---

# Last Session Summary (2026-05-19)

### 📋 Overview of the Session
In this session, we updated the project's documentation to add a Features section and localization support for Traditional Chinese and Japanese, updated preview images, and pushed all updates to GitHub.

### 🛠️ Key Changes
- **`README.md`**:
  - Re-designed the Features list to be concise, highlighting **Hololive & Nijisanji Search** integration.
  - Added a GitHub alert callout stating that a Holodex API key setup is required.
  - Linked standard markdown image embeds for `popup_preview.png` and `settings_preview.png`.
  - Added a language navigation bar: `English | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md)`.
- **`README.zh-TW.md`** & **`README.ja.md`**:
  - Created Traditional Chinese and Japanese localized versions of the documentation.
  - Excluded the `📦 Installation & Development` section to keep it consumer-facing.
  - Embedded preview screenshots and the Holodex key callout note.
- **Preview Assets**:
  - Tracked and staged `popup_preview.png` and `settings_preview.png`.
- **Version Updates**:
  - Confirmed the version bump to `0.1.2.7` inside `overrides/chrome/manifest.json`, `overrides/firefox/manifest.json`, and `package.json`.
- **Git Push**:
  - Staged and committed all the changes and successfully pushed to `origin/main`.

---

# Last Session Summary (2026-05-21)

### 📋 Overview of the Session
In this session, we implemented the "Past Streams" feature, allowing users to view completed streams of VSpo members and followed custom channels via the Holodex API. This includes a new popup tab with infinite scrolling, specialized stream card rendering, filtering rules, configuration preferences, and i18n localization.

### 🛠️ Key Changes

- **Background & API Integration (`src/background/`, `src/common/`):**
  - **`holodex.ts`**: Implemented `getPastStreams` using the Holodex `/v2/videos` API endpoint with `status=past` and offset/limit pagination.
  - **`index.ts`**: 
    - Added `holodexToUnified` duration passthrough and mapped `past` video status.
    - Added background storage update handlers `refreshPastStreams` and `loadMorePastStreams`.
    - Setup alarm listeners with configurable timers to minimize API quota usage.
  - **`types.ts` & `stores.ts`**: Added `pastStreams` and `pastStreamsOffset` session stores, and configured new general settings schema fields (`pastStreamsRefreshInterval` and `showCollabStreams`).
  - **`store.ts`**: Created `usePastStreams` and `usePastStreamsOffset` React hooks.

- **UI Components & Routing (`src/browser/`):**
  - **`PastStreams.tsx`**: Formed a new view utilizing `IntersectionObserver` for infinite scroll pagination, displaying complete VSpo and custom channel past streams. Added a manual refresh button with custom styling.
  - **`StreamCard.tsx`**: Updated to detect `past` status streams, rendering a duration badge on the thumbnail and display relative end-times rather than live-viewer counts.
  - **`GeneralSettings.tsx`**: Extended user settings with a "Past Streams" configuration section for modifying refresh intervals (5m, 15m, 30m, 60m, or manual) and toggling collab streams (`showCollabStreams`).
  - **`Sidebar.tsx`**: Inserted navigation link and `IconHistory` leading to `/streams/past`.
  - **`popup.tsx` & `Root.tsx`**: Added route registration for `/streams/past`.
  - **`LiveStreams.tsx`**: Constrained the Live Streams refresh button to display exclusively on the live streams tab and updated refresh buttons to a premium purple appearance.

- **Localization (`src/common/locales/`):**
  - Added past stream translations, tooltip labels, splash placeholders, and settings labels in English (`en.ts`), Japanese (`ja.ts`), and Traditional Chinese (`zh.ts`).

- **Compilation, Packaging, and Signing:**
  - **Firefox Version**: Compiled (`npm run build:firefox`) and signed as unlisted via `web-ext` using AMO developer credentials. Moved signed artifact to `releases/v0.1.2.7/vspodex-0.1.2.7.xpi`.
  - **Chrome Version**: Compiled (`npm run build:chrome`) and generated production zip archive at `releases/v0.1.2.7/vspodex-chrome-v0.1.2.7.zip`.
  - **Version Bump**: Incrementally bumped codebase version to `0.1.2.8` across `package.json`, `overrides/chrome/manifest.json`, and `overrides/firefox/manifest.json`.
  - **Git Operations**: Staged, committed, and pushed all source and version updates to GitHub `main` branch. Synchronized tags including `v0.1.2.6` and `v0.1.2.7`.

---

# Last Session Summary (2026-05-21 - Session 2)

### 📋 Overview of the Session
In this session, we implemented the experimental Twitch Past Broadcasts feature, introducing a dedicated, experimental "Twitch" sub-tab alongside the default "YouTube" tab under the "Past Streams" view, supporting automatic background updates, settings-based visibility, duration badges parsing, and strict manual refresh/infinite-scroll constraints.

### 🛠️ Key Changes

- **Background & API Integration (`src/background/`, `src/common/`):**
  - **`types.ts`**: Added `enableExperimentalTwitchPast?: boolean` setting key and `HelixVideo` types for Twitch VOD endpoints.
  - **`stores.ts`**: Declared session store `pastTwitchStreams` and default toggle `enableExperimentalTwitchPast: false`.
  - **`store.ts`**: Created hook `usePastTwitchStreams`.
  - **`twitch.ts`**: Implemented `getUserVideos` calling `/helix/videos` to retrieve completed streams.
  - **`index.ts`**: 
    - Designed robust parser `parseTwitchDuration` mapping string formats (e.g. `3h15m20s`) to seconds.
    - Implemented `twitchVideoToUnified` normalizing VOD results to unified structures.
    - Implemented `refreshPastTwitchStreams` calling API in parallel and caching outcomes.
    - Wired `refreshPastTwitchStreams` inside `refreshPastStreams` conditionally behind `enableExperimentalTwitchPast`.
    - Bound store listeners to trigger updates immediately when Settings or Twitch access tokens change.

- **UI Components (`src/browser/`):**
  - **`PastStreams.tsx`**: Constructed customizable styled `SubTabContainer` and `SubTabButton` components. Added YouTube and Twitch sub-tab switching. Conditionally bypassed the scroll-based infinite observer pagination and hid the manual update button on the Twitch sub-tab.
  - **`GeneralSettings.tsx`**: Exposed the experimental toggle checkbox in General Settings under the Past Streams configuration block.

- **Localization (`src/common/locales/`):**
  - Configured labels for the sub-tabs, settings checkboxes, help descriptions, and splash empty messages in English (`en.ts`), Japanese (`ja.ts`), and Traditional Chinese (`zh.ts`).

- **TypeScript Quality & Type-Safety:**
  - Resolved all pre-existing TypeScript warnings regarding optional `browser.identity` globally and verified that `npm run test` type-checking and both packaging targets (`npm run build:chrome` & `npm run build:firefox`) execute successfully.

---

# Last Session Summary (2026-05-21 - Session 3)

### 📋 Overview of the Session
In this session, we enabled the experimental Twitch Past Broadcasts feature by default, updated and localized display names for targeted members, styled the YouTube sub-tab selection red while keeping Twitch brand-indigo, signed and packaged version `0.1.2.8` for both Chrome and Firefox targets, and pushed all updates and tags to GitHub. We also bumped the development version to `0.1.2.9`.

### 🛠️ Key Changes

- **Default Toggles & Compatibility (`src/common/`, `src/background/`):**
  - **`stores.ts`**: Configured default `enableExperimentalTwitchPast: true` in the local settings store.
  - **`PastStreams.tsx` & `index.ts`**: Implemented default-true check fallback (`!== false`) to ensure older user profiles have the Twitch sub-tab active by default.

- **Localization Updates (`src/common/locales/`):**
  - Updated English (`en.ts`), Japanese (`ja.ts`), and Traditional Chinese (`zh.ts`) localization descriptions to show friendly member names (`Yumeno Akari`, `Shiranami Ramune`, `Shinomiya Runa`) instead of raw Twitch user logins.

- **UI Customization (`src/browser/`):**
  - **`PastStreams.tsx`**: Updated `SubTabButton` to accept the custom `isYoutube` prop, styling text and borders red (`text-red-600 dark:text-red-500 border-red-600 dark:border-red-500`) when selected, while keeping the Twitch tab styled in brand-indigo.

- **Firefox AMO Signing and Package Releases:**
  - Completed validation and signed Firefox extension version `0.1.2.8` unlisted via AMO developer API, generating `vspodex-0.1.2.8.xpi`.
  - Packaged and zipped the production Chrome extension version `0.1.2.8` (`vspodex-chrome-v0.1.2.8.zip`).
  - Saved release builds under structured folder `releases/v0.1.2.8/`.
  - Staged, committed, and pushed version `0.1.2.8` commits and tag `v0.1.2.8` to GitHub.

- **Code Version Bump (0.1.2.9):**
  - Incremented package version to `0.1.2.9` across `package.json`, `overrides/chrome/manifest.json`, `overrides/firefox/manifest.json`, and `CHANGELOG.md` in preparation for future releases.

---

# Last Session Summary (2026-05-21 - Session 4)

### 📋 Overview of the Session
In this session, we integrated VTuber Kisaragi Ren (`ren_kisaragi__` / `722162135`) into the experimental Twitch VOD background synchronization loop, updated general setting descriptions across English, Japanese, and Traditional Chinese locales, compiled Chrome and Firefox production extensions under strict type-checking, signed the unlisted Firefox extension package, generated the Chrome extension zip archive, and successfully pushed the codebase and the `v0.1.2.10` release tag to GitHub.

### 🛠️ Key Changes

- **Twitch VOD Sync Target Extension (`src/background/`):**
  - **`index.ts`**: Appended `{ id: "722162135", login: "ren_kisaragi__" }` to `EXPERIMENTAL_TWITCH_USERS` array.

- **Localization Updates (`src/common/locales/`):**
  - **`en.ts`**: Appended `, Kisaragi Ren` to `setting_enable_twitch_past_desc`.
  - **`ja.ts`**: Appended `、如月れん` to `setting_enable_twitch_past_desc`.
  - **`zh.ts`**: Appended `,如月れん` to `setting_enable_twitch_past_desc`.

- **Firefox AMO Signing and Chrome Release Packaging:**
  - Completed type-checking (`npm run test`) and compiled Chrome (`npm run build:chrome`) and Firefox (`npm run build:firefox`) targets successfully.
  - Signed the Firefox extension as unlisted using web-ext AMO developer credentials, producing `vspodex-0.1.2.10.xpi` under `releases/v0.1.2.10/`.
  - Packaged the Chrome extension to `vspodex-chrome-v0.1.2.10.zip` under `releases/v0.1.2.10/`.
  - Bumped package and manifest versions to `0.1.2.10` across all files to bypass Mozilla AMO version conflict checks.

- **Git & Deployment Operations:**
  - Created and pushed Git tag `v0.1.2.10` to remote.
  - Staged, committed, and pushed main branch changes to GitHub.

---

# Last Session Summary (2026-07-01)

### 📋 Overview of the Session
In this session, we diagnosed and resolved a critical cross-browser name mismatch issue where Tachibana Hinano's live stream card displayed Asumi Sena's name. We corrected the default VSpo channels metadata configuration list, implemented a storage database migration in the background service worker to update existing installations, generated production builds, signed both the unlisted Firefox extension version `0.1.2.16` and the listed Firefox extension version `0.1.2.17` via AMO developer credentials, packaged the Chrome extension, updated all release folders, pushed all code updates and tag `v0.1.2.17` to GitHub, and updated the changelog and error log.

### 🛠️ Key Changes

- **Metadata & Mappings:**
  - **`src/common/constants.ts`**: Corrected shifted/incorrect YouTube channel IDs and Twitch handles for all 13 core members of VSpo in `DEFAULT_VSPO_CHANNELS`.

- **Background & Database Migration:**
  - **`src/background/index.ts`**: Implemented a storage database migration in the `onInstalled` listener to dynamically map old mismatched channel IDs to the new correct IDs in both `followedChannels` and `channelCache` on extension updates, ensuring correct lookup names are displayed.
  - **`src/background/modules/holodex.ts`**: Cleaned up comments to clarify Twitch mapping logic.

- **Documentation & Logging:**
  - **`CHANGELOG.md`**: Updated with release notes detailing the channel ID mismatch fix and version bumps (`0.1.2.15`, `0.1.2.16`, and `0.1.2.17`).
  - **`errorlog.md`**: Updated to document the actual root cause and fix implementation details for reference.

- **AMO Signing, Release Packaging, and Version Bump:**
  - Bumped package and manifest versions to `0.1.2.16` (for unlisted) and `0.1.2.17` (for listed) to bypass Firefox AMO version conflicts.
  - Successfully signed the unlisted Firefox extension version `0.1.2.16` using web-ext AMO credentials (`releases/v0.1.2.16/vspodex-0.1.2.16.xpi`).
  - Successfully signed the listed Firefox extension version `0.1.2.17` using web-ext AMO credentials (`releases/v0.1.2.17/vspodex-0.1.2.17.xpi`).
  - Packaged Chrome extension production archives for versions `0.1.2.16` and `0.1.2.17`.

- **Git & Deployment Operations:**
  - Staged, committed, and pushed main branch changes to GitHub.
  - Created and pushed Git tag `v0.1.2.17` to remote.

---

# Last Session Summary (2026-07-01 - Session 2)

### 📋 Overview of the Session
In this session, we implemented dynamic sidebar tab reordering, default-to-subscriber-count sorting on the Members tab categorized by sub-groups (JP, EN, Official), Japanese-only name filtering fallbacks, settings layout tweaks (restoring and reordering the favorite star toggle before the follow button), and localized tab reordering helpers. All changes were compiled and validated across Chrome and Firefox targets.

### 🛠️ Key Changes

- **Custom Sidebar Tab Reordering:**
  - **`src/common/stores.ts`**: Added persistent store `sidebarTabOrder` defaulting to `["live", "members", "upcoming", "past"]` (Live -> Members -> Upcoming -> Past).
  - **`src/browser/hooks/store.ts`**: Added `useSidebarTabOrder` hook.
  - **`src/browser/components/Sidebar.tsx`**: Updated navigation links rendering to sort dynamically based on the state in `sidebarTabOrder`.
  - **`src/browser/views/settings/GeneralSettings.tsx`**: Added a drag-and-drop tab ordering list section using native HTML5 drag handlers (`draggable`, `onDragStart`, `onDragOver`, `onDragEnd`) with a grip handle.

- **Members Tab Sub-groups & Subscriber Sorting:**
  - **`.env`**: Configured `HOLODEX_API_KEY=699724ae-9b6c-4424-b347-6a8f6d9df86a`.
  - **`rspack.config.js`**: Inlined `HOLODEX_API_KEY` environment variable in the EnvironmentPlugin.
  - **`src/background/modules/holodex.ts`**: Modified `getApiKey()` to fallback to `process.env.HOLODEX_API_KEY`.
  - **`src/browser/views/popup/MemberStreams.tsx`**:
    - Grouped non-favorited followed channels into separate **VSPO JP Members**, **VSPO EN Members** (group `"English"`), and **VSPO Official Channels** (group `"Official"`).
    - Sorted members descending by their subscriber count fetched from the Holodex API (falling back to alphabetical sorting).
    - Updated typography of the Member tab title header to match other tabs (`text-sm font-medium text-neutral-500`) and restored the emoji icon (`👤 Members`).

- **Japanese-Only Name Format Fallback:**
  - **`src/common/helpers.ts` (`formatChannelName`)**: Changed formatting behavior to return only the Japanese/native name if it contains Japanese characters (hiragana, katakana, kanji), falling back to the English name only if no Japanese characters are present.

- **Settings Channels Star Toggle Layout:**
  - **`src/browser/views/settings/ChannelSettings.tsx`**: Restored the `<FavoriteButton>` toggle inside the followed channels grid rows, placing it immediately before the `<FollowButton>`.

- **Localization (`src/common/locales/`):**
  - Added new group labels (`group_vspo_jp`, `group_vspo_en`, `group_vspo_official`, `section_tab_order`, `desc_tab_order`) in English (`en.ts`), Japanese (`ja.ts`), and Traditional Chinese (`zh.ts`).

- **Verification:**
  - Completed type-checking (`npm run test`) and successfully compiled Chrome and Firefox production extensions (`npm run build:chrome` & `npm run build:firefox`).

