# TypeScript Compiler Warnings

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

