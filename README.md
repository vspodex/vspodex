# VspoDex 🎮

Track **ぶいすぽっ！ (VSpo)** VTuber live streams with ease. VspoDex is a browser extension that brings together Holodex and Twitch data to keep you updated on your favorite members' activities.

## 🚀 About
This extension is dedicated to the VSpo community. It provides a clean and efficient way to monitor live streams, upcoming schedules, and channel information across both YouTube (via Holodex) and Twitch.

## 🌐 Language Support
VspoDex is fully localized and supports multiple languages. You can change your preferred language under the **Appearance** section on the settings page:
- 🇺🇸 **English** (Default)
- 🇯🇵 **日本語** (Japanese)
- 🇹🇼 **繁體中文** (Traditional Chinese - Taiwanese Style)

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
4.  Click the **Generate** button to create your key.
5.  Copy the key and paste it into the **VspoDex Settings** page.

*Note: A video walkthrough for this process will be added here soon!*

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
