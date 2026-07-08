# VspoDex 🎮

English | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md)

Track **ぶいすぽっ！ (VSpo)** VTuber live streams with ease. VspoDex is a browser extension that brings together Holodex and Twitch data to keep you updated on your favorite members' activities.

## 🚀 About
This extension is dedicated to the VSpo community. It provides a clean and efficient way to monitor live streams, upcoming schedules, and channel information across both YouTube (via Holodex) and Twitch.

> [!IMPORTANT]
> A Holodex API key setup is required for this extension to function. Setup is easy—simply follow the step-by-step instructions provided in the extension settings.

## ⚙️ Features

- **[New] Auto-open Live Favorites**: Quick-toggle lightning bolt on the popup sidebar footer to automatically launch a new tab when an offline favorite member goes live (with support for active/background tab modes, experimental auto-rearming/cycling when streams go offline, and customizable max stream streak limits).
- **[New] Watchlist Scheduled Streams**: Alarm toggle on upcoming stream cards to schedule a tab to open automatically at start time.
- **[New] VSPO! Member Themes**: Personalize the extension's entire UI with dedicated color themes modeled after the official VSPO! GEAR mechanical keyboard designs of 15 members (supporting light/dark modes and polka dot corner accents).
- **[New] Tab Reordering**: Arrange the sequence of popup sidebar tabs (Live, Members, Upcoming, Past) via drag-and-drop on the settings page.
- **[New] Members Tab**: View all followed channels grouped into Favorites, VSPO JP, VSPO EN, and VSPO Official, sorted by subscriber count. Clicking a member shows their stream archive.
- **Unified Stream Tracking**: Monitor live and upcoming streams across both YouTube (via Holodex API) and Twitch.
- **Customizable Channels**: Follow the default VSpo roster or add any custom VTuber channel using YouTube ID.
- **Hololive & Nijisanji Search**: Includes a built-in search and auto-complete function to easily track Hololive and Nijisanji members.
- **Past Streams Archive**: View completed streams across YouTube (with infinite scrolling and collab filtering) and Twitch (featuring experimental background-synced VODs for target members, enabled by default).
- **Aesthetic Customizations**: Select interface themes (Dark, Light, System), font sizes, and sorting options.
- **Language Support**: Fully localized in English, Japanese (日本語), and Traditional Chinese (繁體中文).

## Previews

![Popup Preview](popup_preview.png)
![Settings Preview](settings_preview.png)

## 🌐 Language Support
VspoDex is fully localized and supports multiple languages. You can change your preferred language under the **Appearance** section on the settings page:
- 🇺🇸 **English** (Default)
- 🇯🇵 **日本語** (Japanese)
- 🇹🇼 **繁體中文** (Traditional Chinese)

## 🔑 Requirements
To function correctly, VspoDex requires:
- **Holodex API Key**: A free key is required to fetch stream data from YouTube.
- **Twitch Login**: You will need to log in to Twitch within the extension. This is used solely for API access to check live status; **no personal information or account data is collected or stored.**

## ✨ Credits & Inspiration
A huge shoutout and massive love to [Gumbo](https://github.com/seldszar/gumbo) by **seldszar**. Gumbo's implementation for Twitch and Holodex was a major inspiration for this project.

> [!TIP]
> This is a **vibe coding** project! 🌊 I used AI to plan and architect the project, sourcing inspiration and patterns from Gumbo's excellent codebase. Big thanks to the AI and the open-source community!

## 🛠️ How to Get a Holodex API Key
Getting an API key is quick and free:
1.  Go to [holodex.net](https://holodex.net) and log in.
2.  Click your profile icon in the top-right corner and select **Account Settings**.
3.  Scroll down to the **API Key** section.
4.  Click the **GET NEW API KEY** button to create your key.
5.  Copy the key and paste it into the **VspoDex Settings** page.

## 📦 Installation & Development
If you want to build the extension from source:

### Prerequisites
- Node.js (Latest LTS recommended)
- npm or yarn

### Setup
```bash
# Install dependencies
npm install

# Build for Firefox
npm run build:firefox

# Build for Chrome
npm run build:chrome
```

The build output will be located in `dist/firefox` or `dist/chrome`.

---
*Made with ❤️ for VSpo fans.*
