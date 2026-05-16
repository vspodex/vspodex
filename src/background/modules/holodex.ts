import { DEFAULT_VSPO_CHANNELS } from "~/common/constants";
import { stores } from "~/common/stores";
import { HolodexChannel, HolodexVideo, Dictionary } from "~/common/types";

const BASE_URL = "https://holodex.net/api/v2";

async function getApiKey(): Promise<string | null> {
  return stores.holodexApiKey.get();
}

async function holodexRequest<T>(path: string, params?: Dictionary<string>): Promise<T> {
  const apiKey = await getApiKey();

  if (!apiKey) {
    throw new Error("Holodex API key not set");
  }

  const url = new URL(`${BASE_URL}/${path}`);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, value);
      }
    }
  }

  const response = await fetch(url.toString(), {
    headers: {
      "X-APIKEY": apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Holodex API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch live and upcoming streams for the given channel IDs.
 * Uses the /live endpoint which defaults to live + upcoming streams.
 */
export async function getLiveStreams(channelIds: string[]): Promise<HolodexVideo[]> {
  if (channelIds.length === 0) {
    return [];
  }

  // The /live endpoint doesn't support channel_id filtering directly for multiple IDs,
  // so we fetch all and filter, or use the /users/live endpoint.
  // For a set of channels, the best approach is the /live endpoint with org filter
  // or fetching per-channel. Since VSPO members can be across orgs (or users can add custom),
  // we'll use the general /live endpoint and filter client-side.
  try {
    const videos = await holodexRequest<HolodexVideo[]>("live", {
      status: "live,upcoming",
      type: "stream",
      sort: "available_at",
      order: "asc",
      max_upcoming_hours: "48",
      limit: "9999",
    });

    // Filter to only followed channels
    const channelIdSet = new Set(channelIds);
    return videos.filter((video) => channelIdSet.has(video.channel.id));
  } catch (error) {
    console.error("[VspoDex] Error fetching live streams:", error);
    return [];
  }
}

/**
 * Fetch channels for a given org (e.g., "VSpo").
 */
export async function getChannelsByOrg(org: string): Promise<HolodexChannel[]> {
  try {
    return await holodexRequest<HolodexChannel[]>("channels", {
      org,
      type: "vtuber",
      limit: "100",
    });
  } catch (error) {
    console.error("[VspoDex] Error fetching channels:", error);
    return [];
  }
}

/**
 * Search channels by name.
 */
export async function searchChannels(query: string): Promise<HolodexChannel[]> {
  try {
    // The channels endpoint supports filtering — we'll use it with a limit
    // and match names client-side since the API doesn't have a search param for channels.
    const channels = await holodexRequest<HolodexChannel[]>("channels", {
      type: "vtuber",
      limit: "50",
    });

    const lowerQuery = query.toLowerCase();
    return channels.filter(
      (ch) =>
        ch.name.toLowerCase().includes(lowerQuery) ||
        (ch.english_name && ch.english_name.toLowerCase().includes(lowerQuery)),
    );
  } catch (error) {
    console.error("[VspoDex] Error searching channels:", error);
    return [];
  }
}

/**
 * Refresh the VSPO channel list from Holodex and update the channel cache.
 * Returns the fetched channels.
 */
export async function refreshVspoChannels(): Promise<HolodexChannel[]> {
  const channels = await getChannelsByOrg("VSpo");

  if (channels.length > 0) {
    const defaultTwitchMap = new Map(DEFAULT_VSPO_CHANNELS.map(c => [c.id, c.twitch]));

    // Replace the cache entirely with the fresh VSPO channels
    // preserving twitch logins from our defaults if they are missing
    const newCache = channels.map(ch => {
      if (!ch.twitch && defaultTwitchMap.has(ch.id)) {
        ch.twitch = defaultTwitchMap.get(ch.id);
      }
      return ch;
    });

    await stores.channelCache.set(newCache);

    // Filter followed channels to only include active VSPO members from the new cache
    const currentFollowed = await stores.followedChannels.get();
    const vspoIdSet = new Set(channels.map((ch) => ch.id));
    
    // Only keep followed channels that are actually in the new cache
    const newFollowed = currentFollowed.filter(id => vspoIdSet.has(id));
    
    // Auto-follow any new VSPO members if desired?
    // Let's just follow all VSPO members by default like before, but cleanly
    for (const id of vspoIdSet) {
      if (!newFollowed.includes(id)) {
        newFollowed.push(id);
      }
    }

    await stores.followedChannels.set(newFollowed);
  }

  return channels;
}

/**
 * Fetch channel info for a set of channel IDs and update the cache.
 */
export async function fetchAndCacheChannels(channelIds: string[]): Promise<HolodexChannel[]> {
  const existingCache = await stores.channelCache.get();
  const cacheMap = new Map(existingCache.map((ch) => [ch.id, ch]));

  const uncachedIds = channelIds.filter((id) => !cacheMap.has(id));

  if (uncachedIds.length > 0) {
    // Fetch uncached channels one by one (Holodex doesn't have a batch endpoint for channel info)
    for (const id of uncachedIds) {
      try {
        const channel = await holodexRequest<HolodexChannel>(`channels/${id}`);
        cacheMap.set(id, channel);
      } catch (error) {
        console.error(`[VspoDex] Failed to fetch channel ${id}:`, error);
      }
    }

    await stores.channelCache.set(Array.from(cacheMap.values()));
  }

  return channelIds
    .map((id) => cacheMap.get(id))
    .filter((ch): ch is HolodexChannel => ch !== undefined);
}
