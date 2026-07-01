# TypeScript Compiler Warnings

## Root Cause
1. `browser.identity` was flagged as possibly undefined (`TS18048`) inside `src/background/modules/twitch.ts` during strict type checks.
2. Direct truthiness validation of `browser.identity!.launchWebAuthFlow` triggered warning `TS2774` indicating that the function property is always defined in type signatures.

## Action Taken
1. Appended non-null assertions (`browser.identity!`) to operations gated behind `hasIdentityApi()`.
2. Refactored the method presence check to `typeof browser.identity!.launchWebAuthFlow === "function"`.
3. Verified all types build and resolve successfully via `npm run test`.

---

# Firefox-Only Twitch Channel Name Mismatch (Hinano shows as Sena)

## Symptom
When Tachibana Hinano (`hinanotachiba7`) is live on Twitch, Firefox shows Asumi Sena's name on the stream card (though the URL correctly points to Hinano's stream). This does not occur in Chrome.

## Root Cause
`Store.getState()` in `src/common/stores.ts` applies `defaultsDeep(item.value, this.options.defaultValue)` to all stored objects. `defaultsDeep` from es-toolkit treats arrays as positional (merges by index). The `channelCache` store is an array of `HolodexChannel` objects. After `refreshVspoChannels()` writes Holodex API data to `channelCache`, the API-returned channel order differs from the hardcoded `DEFAULT_VSPO_CHANNELS` order. On subsequent `getState()` reads, `defaultsDeep` merges each stored channel entry at index N with the default entry at index N — corrupting channel-to-twitch-login mappings (e.g., Hinano's entry gets patched with Sena's default fields).

Firefox is exclusively affected because its persistent background page reads `channelCache` from `local` storage on every refresh cycle, hitting this merge corruption repeatedly. Chrome's ephemeral service worker doesn't accumulate the same state.

## Fix
`src/common/stores.ts` — `Store.getState()`, line 79:
Changed condition to skip `defaultsDeep` when `item.value` is an array. Arrays are now returned as-is from storage without positional merging against the default value.

```diff
-state.value = isObject(item.value)
-  ? defaultsDeep(item.value, this.options.defaultValue)
-  : item.value;
+state.value = Array.isArray(item.value) || !isObject(item.value)
+  ? item.value
+  : defaultsDeep(item.value, this.options.defaultValue);
```

## Follow-up: Migration for Existing Installs
The `defaultsDeep` fix only prevents future corruption. Existing installs have a corrupted `channelCache` already persisted in `browser.storage.local`. Added a one-time migration in `src/background/index.ts` inside `onInstalled` with `details.reason === "update"`: calls `stores.channelCache.reset()` to flush the corrupted array back to the clean `DEFAULT_VSPO_CHANNELS` default, then immediately re-runs `refreshVspoChannels()` to repopulate from the Holodex API. The `reason === "update"` guard ensures this only fires on updates, not fresh installs.
