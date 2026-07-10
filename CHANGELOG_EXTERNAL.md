# VspoDex Changelog (External Release)

This external changelog summarizes the user-facing changes, new features, and bug fixes introduced in the current release (**v0.1.3.20**) compared to the last public release (**v0.1.3.4**).

---

## [0.1.3.20] - 2026-07-10

### ⚙️ Settings Backup & Restore (Import/Export)
* **Secure Export/Import**: You can now export your extension settings to a JSON format or import them to easily restore your configuration on another device or browser.
* **Privacy Safeguard**: The Holodex API key is automatically excluded from the export data to prevent accidental sharing of your credentials.
* **Format Validation**: The settings import field validates inputs automatically, checking for correct YouTube Channel IDs and formats before applying.

---

### ⚡ Enhanced Auto-Open Favorites (Streak Mode)
* **Max Stream Streak Option**: Control the number of streams to auto-open in a single sequence. Set a limit of `1`, `2`, `3`, `5`, `10`, `20`, or `Unlimited` under General Settings.
* **Three-State Favorites Trigger**: The lightning bolt icon in the sidebar footer now visually represents the status:
  * **Disarmed** (Grey slashed)
  * **Armed** (Yellow outline)
  * **Active Streak Mode** (Solid pulsing yellow)
* **Manual Streak Tracking**: 
  * Added a manual streak bolt button directly onto live cards so you can start a streak for any specific stream.
  * Added a setting to automatically treat all manually clicked live cards as part of your viewing streak.
* **Multi-Stream Tracking**: Track multiple manually opened streams in parallel. The extension will wait until all active streams end before cycling to the next favorite.
* **Improved Stream Detection**: Bypassed stale checks for delayed and guerrilla streams, allowing them to open automatically when detected.

---

### 🔔 Scheduled Stream Watchlist
* **Auto-Open Upcoming Streams**: Added an alarm toggle button on upcoming stream cards. Activating this will schedule the stream to be automatically opened in a new tab the moment it goes live.
* **Persistent Alarms**: Scheduled alarms are stored securely and remain scheduled even after the browser restarts or the extension sleeps.

---

### 🛠️ General Stability & Bug Fixes
* **Sleep & Suspend Grace Guard**: Added a guard to prevent old tabs or stale streams from opening immediately after the computer wakes up from sleep or recovers from network offline states.
* **Twitch Channel ID Mapping**: Unified and corrected Twitch channel ID associations to ensure Twitch live streams respect your followed favorites configuration correctly.
* **Interface Tweaks**: Fixed unclickable card bugs when auto-rearm was toggled off, and restored proper tab/window click target behavior in streak mode.
