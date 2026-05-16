import { Browser } from "webextension-polyfill";

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      TWITCH_CLIENT_ID: string;
      TWITCH_REDIRECT_URI: string;
    }
  }

  // Extend the Browser type with identity API (not in polyfill types, but
  // available at runtime via polyfill wrapping chrome.identity in Chrome
  // and natively in Firefox)
  interface BrowserIdentity {
    getRedirectURL(path?: string): string;
    launchWebAuthFlow(details: {
      url: string;
      interactive?: boolean;
    }): Promise<string>;
  }

  interface ExtendedBrowser extends Browser {
    identity?: BrowserIdentity;
  }

  const browser: ExtendedBrowser;
}
