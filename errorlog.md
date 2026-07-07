# Member Header & Anchor Props TypeScript Errors

## Symptom
During compilation (`npm run test`), the following TS errors occurred:
1. `TS2345`: `t` from `useTranslation` hook expects `TranslationKey` but `formatSubscriberCount` took a generic `string` for its `localeFormatter` parameter.
2. `TS2322`: The `SocialLink` custom components passed a `title` prop down to `Anchor` component, but `AnchorProps` did not extend standard anchor element attributes, leading to a property mismatch.

## Root Cause
1. Incompatible typing signature in the `localeFormatter` argument.
2. `AnchorProps` lacked `AnchorHTMLAttributes` inheritance, preventing standard HTML attributes (like `title`) from being passed.

## Fix
1. Simplified `formatSubscriberCount` signature to return only the formatted count string, and moved the `t` wrapper call inside the JSX rendering logic to keep types resolved automatically.
2. Extended `AnchorProps` from `AnchorHTMLAttributes<HTMLAnchorElement>` in `Anchor.tsx` and destructured/forwarded other props (`...rest`).

---

# TypeScript Compiler Warnings (Previous)

## Root Cause
1. `browser.identity` was flagged as possibly undefined (`TS18048`) inside `src/background/modules/twitch.ts` during strict type checks.
2. Direct truthiness validation of `browser.identity!.launchWebAuthFlow` triggered warning `TS2774` indicating that the function property is always defined in type signatures.

## Action Taken
1. Appended non-null assertions (`browser.identity!`) to operations gated behind `hasIdentityApi()`.
2. Refactored the method presence check to `typeof browser.identity!.launchWebAuthFlow === "function"`.
3. Verified all types build and resolve successfully via `npm run test`.

---

# Twitch Channel Name Mismatch (Hinano shows as Sena) — Cross-Browser

## Symptom
When Tachibana Hinano (`hinanotachiba7`) is live on Twitch, the extension shows Asumi Sena's name on the stream card, though the URL correctly points to Hinano's stream. Affects both Chrome and Firefox.

## Incorrect Initial Diagnosis (0.1.2.12)
Attributed to `defaultsDeep` positional array merging in `Store.getState()` — assumed Holodex channel order differed from `DEFAULT_VSPO_CHANNELS` and merged `twitch` fields by index, corrupting the cache. This was wrong: `defaultsDeep` only fills MISSING fields; it does not overwrite existing values. The `stores.ts` fix is valid as a defensive measure but was not the root cause.

## Actual Root Cause
The core mappings in `DEFAULT_VSPO_CHANNELS` (`src/common/constants.ts`) had shifted and mismatched YouTube channel IDs.
Specifically:
- Asumi Sena's correct YouTube ID (`UCF_U2GCKHvDz52jWdizppIA`) was mapped to Tachibana Hinano.
- Tachibana Hinano's correct YouTube ID (`UCvUc0m317LWTTPZoBQV479A`) was mapped to Toto Kogara.
- Toto Kogara's correct YouTube ID (`UCgTzsBI0DIRopMylJEDqnog`) was mapped to Kurumi Noah.
- Kurumi Noah's correct YouTube ID (`UCIcAj6WkJ8vZ7DeJVgmeqKw`) was not mapped, etc.

Because of this shift, when the background service worker fetched channels from Holodex, the unconditional override logic in `refreshVspoChannels()` mapped the correct ID `UCF_U2GCKHvDz52jWdizppIA` (belonging to Asumi Sena) to the Twitch handle of Tachibana Hinano (`hinanotachiba7`). Thus, the channel cache record for Asumi Sena was associated with Twitch login `"hinanotachiba7"`. When Tachibana Hinano streamed live on Twitch, the lookup matched the first cached channel with `twitch: "hinanotachiba7"`, which resolved to Asumi Sena.

## Fix
1. Corrected all 13 core member mappings (YouTube channel IDs and Twitch handles) in `DEFAULT_VSPO_CHANNELS` (`src/common/constants.ts`).
2. Updated the service worker `onInstalled` update migration block (`src/background/index.ts`) to translate all old/incorrect IDs to the correct IDs in both `followedChannels` and `channelCache`, and update incorrect Twitch handles.

---

# Invalid Holodex API Key Connection Status Issue

## Symptom
When an invalid Holodex API key was inserted or changed to in the settings page, the connection status still showed "Connected" with a check mark.

## Root Cause
The connection status of the Holodex API was determined solely by the presence of a key string in the `holodexApiKey` store. No validation checks were executed or stored to ensure the key's authenticity. If requests failed with `401 Unauthorized` or `403 Forbidden` due to an invalid key, the errors were caught and swallowed, leading the extension to silently return empty results while leaving the UI state unchanged as "Connected".

## Action Taken
1. Added a `holodexApiKeyVerified` store to track the verification status of the key.
2. Implemented a `validateHolodexApiKey` endpoint/message in the background script to test a key with a request.
3. Updated the `handleSaveApiKey` workflow in `ApiKeySettings.tsx` to validate a newly input key against the API first. It alerts the user if the validation fails and marks the verified status as false.
4. Updated `holodexRequest` in the background script to dynamically set `holodexApiKeyVerified` to false on receiving 400/401/403 errors and to true on successful calls.
5. Adjusted UI pages (`ApiKeySettings.tsx`, `ChannelSettings.tsx`, and `LiveStreams.tsx`) to check the verified status. If the key is present but not verified, it renders "Not connected" and restricts actions requiring a valid key.

---

# Channel Pages Stream Sorting Bug (YouTube streams sorted below Twitch streams)

## Symptom
When viewing a followed channel's stream list page under the Members tab, past Twitch streams were consistently displayed ahead of past YouTube streams, regardless of chronological order.

## Root Cause
`ytStreams` from the Holodex API populated their `startedAt` property from `video.start_actual`. For many past streams, `video.start_actual` was not returned or was null. This resulted in `a.startedAt` being null, which evaluates to timestamp 0 during chronological comparison sorting in `MemberStreams.tsx`. Consequently, past Twitch streams (which always had valid timestamps) were prioritized ahead of all past YouTube streams in descending order.

## Action Taken
Updated `holodexToUnified` in [index.ts](file:///h:/vspodex/vspodex/src/background/index.ts) to fallback to `video.published_at` and `video.available_at` if `video.start_actual` is null:
`startedAt: video.start_actual ?? video.published_at ?? video.available_at ?? null`
This ensures all past YouTube streams have valid ISO 8601 timestamps and sort correctly chronologically.

---

# Keyboard Shortcut tab switching fails in Chrome

## Symptom
Keyboard shortcuts to switch to a specific tab work correctly in Firefox but fail to open the popup or switch tabs in Chrome.

## Root Cause
In Chrome, `chrome.action.openPopup()` requires a valid user gesture context to execute. In our initial implementation, we performed an asynchronous write to the storage using `await stores.targetTab.set(path);` before calling `browser.action.openPopup()`. By the time the asynchronous write completed, the synchronous user gesture context from the keyboard shortcut was lost/expired, causing Chrome to reject the `openPopup` call. Firefox has a more relaxed duration or constraint on the user gesture token, so it worked there.

## Action Taken
Modified the command listener in [index.ts](file:///h:/vspodex/vspodex/src/background/index.ts) to execute `browser.action.openPopup()` synchronously in the initial event handler call stack before waiting for the storage write (`stores.targetTab.set`) to complete. This preserves the user gesture token for Chrome.

---

# Past Stream Display Date Incorrect

## Symptom
The display date (ended relative time) for past YouTube streams on member channel pages and the Past Streams tab displayed incorrect dates (such as "<1m" or dates too far in the past/future) even though the actual chronological order was correct.

## Root Cause
In `holodexToUnified` (`src/background/index.ts`), `startedAt` fell back to `video.published_at` before `video.available_at` when `video.start_actual` was null. On YouTube, `published_at` for a live stream can represent the date the stream reservation/metadata was created (which can be days or weeks before the stream actually aired). Since the ended relative time (`endedAgo` in `StreamCard.tsx`) is calculated as `startedAt + duration`, setting `startedAt` to the reservation date caused the calculated end time to be way in the past or future, rendering the relative end time text incorrect.

## Action Taken
Modified `holodexToUnified` in [index.ts](file:///h:/vspodex/vspodex/src/background/index.ts) to fallback directly to `video.available_at` when `video.start_actual` is null, bypassing `video.published_at`. Since `available_at` corresponds to the actual start time or scheduled start time when the stream went live, this ensures the calculated stream end time is accurate.

