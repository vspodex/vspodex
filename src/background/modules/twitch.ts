import { camelCase, castArray, get, snakeCase, toString } from "es-toolkit/compat";

import { changeCase, openUrl } from "~/common/helpers";
import { stores } from "~/common/stores";
import { Dictionary, HelixResponse, HelixStream, HelixUser } from "~/common/types";

class RequestError extends Error {
  constructor(
    readonly request: Request,
    readonly response: Response,
  ) {
    super(`Request failed with status code ${response.status}: ${request.method} ${request.url}`);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RequestError);
    }
  }
}

export async function request<T>(
  path: string,
  params?: Dictionary<unknown>,
): Promise<HelixResponse<T>> {
  const url = new URL(path, "https://api.twitch.tv/helix/");

  for (const [name, value] of Object.entries(params ?? {})) {
    for (const v of castArray(value)) {
      if (v === undefined) {
        continue;
      }

      url.searchParams.append(snakeCase(name), toString(v));
    }
  }

  const clientId = process.env.TWITCH_CLIENT_ID;

  const request = new Request(url, {
    headers: {
      ...(clientId ? { "Client-ID": clientId } : {}),
    },
  });

  const accessToken = await stores.twitchAccessToken.get();

  if (accessToken) {
    request.headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(request);

  if (response.status === 204) {
    return undefined as never;
  }

  if (response.ok) {
    return changeCase(await response.json(), camelCase);
  }

  throw new RequestError(request, response);
}

async function paginate<T>(path: string, params?: Dictionary<unknown>): Promise<T[]> {
  const { data, pagination } = await request<T>(path, params);

  if (pagination.cursor) {
    return data.concat(await paginate(path, { ...params, after: pagination.cursor }));
  }

  return data;
}

export async function getCurrentUser() {
  return get(await request<HelixUser>("users"), "data.0", null);
}

export async function getFollowedStreams(userId: string) {
  return paginate<HelixStream>("streams/followed", {
    first: 100,
    userId,
  });
}

export async function getStreams(userLogins: string[]) {
  if (userLogins.length === 0) {
    return [];
  }
  return paginate<HelixStream>("streams", {
    first: 100,
    user_login: userLogins,
  });
}

// ─── Identity helpers (cross-browser via webextension-polyfill) ──

function hasIdentityApi(): boolean {
  // browser.identity is provided by webextension-polyfill in Chrome
  // and natively in Firefox
  return typeof browser !== "undefined" && browser.identity != null;
}

export function getRedirectUrl(): string {
  if (process.env.TWITCH_REDIRECT_URI) {
    return process.env.TWITCH_REDIRECT_URI;
  }

  if (hasIdentityApi()) {
    return browser.identity.getRedirectURL();
  }

  return "";
}

export async function authorize() {
  const clientId = process.env.TWITCH_CLIENT_ID;

  if (!clientId) {
    console.warn("[VspoDex] TWITCH_CLIENT_ID not configured");
    return;
  }

  const redirectUri = getRedirectUrl();

  console.log("[VspoDex] Twitch OAuth redirect URI:", redirectUri);
  console.log("[VspoDex] ⚠️ Make sure this URL is added to your Twitch app's OAuth Redirect URLs at https://dev.twitch.tv/console/apps");

  if (!redirectUri) {
    console.warn("[VspoDex] No redirect URI available");
    return;
  }

  const url = new URL("https://id.twitch.tv/oauth2/authorize");

  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", "user:read:follows");
  url.searchParams.set("response_type", "token");

  console.log("[VspoDex] Opening Twitch auth URL:", url.href);

  if (hasIdentityApi() && browser.identity.launchWebAuthFlow) {
    try {
      const responseUrl = await browser.identity.launchWebAuthFlow({
        url: url.href,
        interactive: true,
      });

      if (responseUrl) {
        const hash = new URL(responseUrl).hash.substring(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get("access_token");

        if (accessToken) {
          await stores.twitchAccessToken.set(accessToken);
          console.log("[VspoDex] Twitch OAuth successful!");
        }
      }
    } catch (error) {
      console.error("[VspoDex] OAuth flow error:", error);
      console.error("[VspoDex] ⚠️ If you see 'Authorization page could not be loaded', add this redirect URL to your Twitch app:", redirectUri);
    }
  } else {
    // Fallback: open in a new tab
    return openUrl(url.href, undefined, true);
  }
}

export async function validate() {
  const accessToken = await stores.twitchAccessToken.get();

  if (accessToken) {
    const response = await fetch("https://id.twitch.tv/oauth2/validate", {
      headers: {
        Authorization: `OAuth ${accessToken}`,
      },
    });

    if (response.status === 401) {
      console.warn("[VspoDex] Twitch token expired or invalid, clearing...");
      await stores.twitchAccessToken.set(null);
    }

    return response.ok;
  }

  return false;
}

export async function revoke() {
  const token = await stores.twitchAccessToken.get();
  const clientId = process.env.TWITCH_CLIENT_ID;

  if (token && clientId) {
    fetch("https://id.twitch.tv/oauth2/revoke", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        token,
      }),
    });
  }

  await stores.twitchAccessToken.set(null);
  await stores.twitchUser.set(null);
}
