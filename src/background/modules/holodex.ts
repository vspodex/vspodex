import { DEFAULT_VSPO_CHANNELS } from "~/common/constants";
import { stores } from "~/common/stores";
import { HolodexChannel, HolodexVideo, Dictionary, SuggestionChannel } from "~/common/types";

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

    const currentFollowed = await stores.followedChannels.get();
    const vspoIdSet = new Set(channels.map((ch) => ch.id));

    // Keep custom channels in the cache (channels not belonging to VSpo)
    const currentCache = await stores.channelCache.get();
    for (const cachedCh of currentCache) {
      const isVspo = cachedCh.org === "VSpo" || cachedCh.group === "VSPO";
      if (!vspoIdSet.has(cachedCh.id) && !isVspo) {
        newCache.push(cachedCh);
      }
    }

    await stores.channelCache.set(newCache);

    const newCacheIdSet = new Set(newCache.map((ch) => ch.id));
    
    // Only keep followed channels that are actually in the new cache
    // (This automatically preserves our custom channels since we added them above)
    const newFollowed = currentFollowed.filter(id => newCacheIdSet.has(id));
    
    // Auto-follow only newly debuted VSPO members (channels that were not in the previous cache)
    // to avoid re-following members that the user has explicitly unfollowed.
    const isFirstInit = currentCache.length === 0;
    const previousVspoIds = new Set(
      currentCache
        .filter(ch => ch.org === "VSpo" || ch.group === "VSPO")
        .map(ch => ch.id)
    );

    for (const id of vspoIdSet) {
      if (!newFollowed.includes(id)) {
        if (isFirstInit || !previousVspoIds.has(id)) {
          newFollowed.push(id);
        }
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

/**
 * Add a custom channel by its YouTube ID.
 * Fetches info from Holodex and adds it to the followed list.
 * Returns true if successful, false if not found.
 */
export async function addCustomChannel(channelId: string): Promise<boolean> {
  try {
    const channel = await holodexRequest<HolodexChannel>(`channels/${channelId}`);
    if (channel && channel.id) {
      // Add to cache
      const currentCache = await stores.channelCache.get();
      const cacheMap = new Map(currentCache.map((ch) => [ch.id, ch]));
      cacheMap.set(channel.id, channel);
      await stores.channelCache.set(Array.from(cacheMap.values()));

      // Add to followed
      const currentFollowed = await stores.followedChannels.get();
      if (!currentFollowed.includes(channel.id)) {
        currentFollowed.push(channel.id);
        await stores.followedChannels.set(currentFollowed);
      }
      return true;
    }
  } catch (error) {
    console.error(`[VspoDex] Failed to add custom channel ${channelId}:`, error);
  }
  return false;
}

const HARDCODED_CUSTOM_IDS = ["UCgYCMluaLpERsyNXlPOvBtA", "UCIu-aUArYq_H84dBpCAokMA"];

/**
 * Ensures hardcoded custom channels are added to the cache and followed list
 * if they are not already present.
 */
export async function ensureCustomChannels(): Promise<void> {
  const hasMigrated = await stores.customChannelsMigrated.get();
  if (hasMigrated) return;

  const apiKey = await stores.holodexApiKey.get();
  if (!apiKey) return;

  const currentCache = await stores.channelCache.get();
  const cacheIds = new Set(currentCache.map(c => c.id));
  
  for (const id of HARDCODED_CUSTOM_IDS) {
    if (!cacheIds.has(id)) {
      await addCustomChannel(id);
    }
  }

  await stores.customChannelsMigrated.set(true);
}

/**
 * Fetch all channels for a given organization (paginated).
 */
async function fetchAllForOrg(orgName: string): Promise<HolodexChannel[]> {
  let all: HolodexChannel[] = [];
  let offset = 0;
  const limit = 100;
  
  while (true) {
    const channels = await holodexRequest<HolodexChannel[]>("channels", {
      type: "vtuber",
      org: orgName,
      limit: String(limit),
      offset: String(offset),
    });

    if (!channels || channels.length === 0) {
      break;
    }
    all = all.concat(channels);
    if (channels.length < limit) {
      break; // Last page
    }
    offset += limit;
  }
  return all;
}

/**
 * Fetch top independent channels sorted by subscriber count.
 */
async function fetchTopIndependents(count: number): Promise<HolodexChannel[]> {
  let all: HolodexChannel[] = [];
  let offset = 0;
  const limit = 100;
  
  while (all.length < count) {
    const fetchLimit = Math.min(limit, count - all.length);
    const channels = await holodexRequest<HolodexChannel[]>("channels", {
      type: "vtuber",
      org: "Independents",
      sort: "subscriber_count",
      order: "desc",
      limit: String(fetchLimit),
      offset: String(offset),
    });

    if (!channels || channels.length === 0) {
      break;
    }
    all = all.concat(channels);
    if (channels.length < fetchLimit) {
      break;
    }
    offset += fetchLimit;
  }
  return all;
}

/**
 * Synchronize the suggestions search channel list from Holodex API.
 * Fetches Hololive, Nijisanji, Neo-Porte, and the top 200 independent channels.
 * Deduplicates them, maps them, and writes the list to stores.
 */
export async function refreshSearchChannelsList(): Promise<number> {
  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new Error("Holodex API key not set");
  }

  // Fetch all orgs in parallel to optimize speed
  const [hololive, nijisanji, neoporte, independents] = await Promise.all([
    fetchAllForOrg("Hololive"),
    fetchAllForOrg("Nijisanji"),
    fetchAllForOrg("Neo-Porte"),
    fetchTopIndependents(200),
  ]);

  const combined = [...hololive, ...nijisanji, ...neoporte, ...independents];

  // Map to simple SuggestionChannel format and deduplicate by channel id
  const seenIds = new Set<string>();
  const suggestionChannels: SuggestionChannel[] = [];

  for (const ch of combined) {
    if (ch && ch.id && !seenIds.has(ch.id)) {
      seenIds.add(ch.id);
      suggestionChannels.push({
        id: ch.id,
        name: ch.name,
        english_name: ch.english_name || null,
        org: ch.org || null,
        photo: ch.photo || null,
      });
    }
  }

  await stores.searchChannelsList.set(suggestionChannels);
  await stores.searchChannelsLastUpdated.set(Date.now());

  return suggestionChannels.length;
}
