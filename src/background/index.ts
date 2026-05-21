import { get } from "es-toolkit/compat";

import { openUrl } from "~/common/helpers";
import { stores } from "~/common/stores";
import { HolodexVideo, HelixStream, UnifiedStream } from "~/common/types";
import { DEFAULT_VSPO_CHANNELS } from "~/common/constants";

import { refreshActionBadge } from "./modules/badge";
import { getLiveStreams, getPastStreams, refreshVspoChannels, fetchAndCacheChannels, getChannelsByOrg, addCustomChannel, ensureCustomChannels, refreshSearchChannelsList } from "./modules/holodex";
import {
  authorize,
  getCurrentUser,
  getStreams,
  getRedirectUrl,
  request,
  revoke,
  validate,
} from "./modules/twitch";

import { formatChannelName } from "~/common/helpers";

// ─── Convert Holodex video to UnifiedStream ────────────────

function holodexToUnified(video: HolodexVideo): UnifiedStream {
  const channelName = formatChannelName(video.channel.name, video.channel.english_name, video.channel.group);

  const status = video.status === "live" ? "live" : video.status === "past" ? "past" : "upcoming";

  return {
    id: `holodex:${video.id}`,
    channelId: video.channel.id,
    title: video.title,
    channelName,
    channelAvatar: video.channel.photo,
    viewerCount: video.live_viewers ?? null,
    startedAt: video.start_actual ?? null,
    scheduledAt: video.start_scheduled ?? video.available_at,
    status,
    source: "holodex",
    url: `https://www.youtube.com/watch?v=${video.id}`,
    thumbnailUrl: `https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`,
    duration: video.duration ?? null,
    topicId: video.topic_id,
  };
}

// ─── Convert Twitch stream to UnifiedStream ────────────────

function twitchToUnified(stream: HelixStream, formattedName?: string): UnifiedStream {
  return {
    id: `twitch:${stream.id}`,
    channelId: stream.userId,
    title: stream.title,
    channelName: formattedName || stream.userName,
    channelAvatar: null,
    viewerCount: stream.viewerCount,
    startedAt: stream.startedAt,
    scheduledAt: null,
    status: "live",
    source: "twitch",
    url: `https://twitch.tv/${stream.userLogin}`,
    thumbnailUrl: stream.thumbnailUrl
      .replace("{width}", "96")
      .replace("{height}", "54"),
    gameName: stream.gameName,
  };
}

// ─── Main Refresh Loop ────────────────────────────────────

async function refresh() {
  const settings = await stores.settings.get();
  const intervalMinutes = settings.general.refreshInterval || 1;

  browser.alarms.create("refresh", {
    periodInMinutes: intervalMinutes,
  });

  if (!navigator.onLine) {
    return;
  }

  // Silent background sync check for VTuber search list (stale after 7 days)
  try {
    const apiKey = await stores.holodexApiKey.get();
    if (apiKey) {
      const list = await stores.searchChannelsList.get();
      const lastUpdated = await stores.searchChannelsLastUpdated.get();
      const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
      if (list.length === 0 || Date.now() - lastUpdated > oneWeekMs) {
        console.log("[VspoDex] VTuber search list is empty or stale. Silently syncing in background...");
        refreshSearchChannelsList().catch(err => {
          console.error("[VspoDex] Silent background sync failed:", err);
        });
      }
    }
  } catch (err) {
    console.error("[VspoDex] Failed checking search list status:", err);
  }

  const allLive: UnifiedStream[] = [];
  const allUpcoming: UnifiedStream[] = [];

  // ── Holodex streams ──
  try {
    const apiKey = await stores.holodexApiKey.get();

    if (apiKey) {
      await ensureCustomChannels();
      const followedChannels = await stores.followedChannels.get();
      const videos = await getLiveStreams(followedChannels);

      for (const video of videos) {
        const unified = holodexToUnified(video);

        if (unified.status === "live") {
          allLive.push(unified);
        } else {
          allUpcoming.push(unified);
        }
      }
    }
  } catch (error) {
    console.error("[VspoDex] Holodex refresh error:", error);
  }

  // ── Twitch streams ──
  try {
    const hasToken = await stores.twitchAccessToken.get();

    if (!hasToken) {
      console.log("[VspoDex] Twitch: No access token, skipping.");
    } else {
      const isValid = await validate();
      console.log("[VspoDex] Twitch: Token validation result:", isValid);

      if (isValid) {
        const twitchUser = await getCurrentUser();
        console.log("[VspoDex] Twitch: Current user:", twitchUser?.displayName ?? "null");

        if (twitchUser) {
          await stores.twitchUser.set(twitchUser);
        }

        const followedChannels = await stores.followedChannels.get();
        const cachedChannels = await stores.channelCache.get();
        
        // Add a fallback to the default list in case they haven't refreshed Holodex channels yet
        const defaultTwitchMap = new Map(DEFAULT_VSPO_CHANNELS.map(c => [c.id, c.twitch]));

        const twitchLogins = cachedChannels
          .filter(c => followedChannels.includes(c.id))
          .map(c => c.twitch || defaultTwitchMap.get(c.id))
          .filter(Boolean) as string[];

        if (twitchLogins.length > 0) {
          const twitchStreams = await getStreams(twitchLogins);
          console.log("[VspoDex] Twitch: Found", twitchStreams.length, "followed streams live out of", twitchLogins.length, "logins.");
          await stores.twitchStreams.set(twitchStreams);

          for (const stream of twitchStreams) {
            const hc = cachedChannels.find(
              c => c.twitch?.toLowerCase() === stream.userLogin.toLowerCase()
                || defaultTwitchMap.get(c.id)?.toLowerCase() === stream.userLogin.toLowerCase()
            );
            const formattedName = hc ? formatChannelName(hc.name, hc.english_name, hc.group) : undefined;
            allLive.push(twitchToUnified(stream, formattedName));
          }
        } else {
          await stores.twitchStreams.set([]);
        }
      }
    }
  } catch (error) {
    console.error("[VspoDex] Twitch refresh error:", error);
  }

  // ── Sort: live by start time (longest running first), upcoming by scheduled time ──
  const sortBy = settings.general?.sortBy || "viewerCount";
  const sortOrder = settings.general?.sortOrder || "desc";

  allLive.sort((a, b) => {
    let cmp = 0;
    if (sortBy === "viewerCount") {
      cmp = (a.viewerCount || 0) - (b.viewerCount || 0);
    } else {
      const aTime = a.startedAt ? new Date(a.startedAt).getTime() : Infinity;
      const bTime = b.startedAt ? new Date(b.startedAt).getTime() : Infinity;
      // For duration, older start time means longer duration.
      // So if a is older (smaller timestamp), a should be "greater" in terms of duration.
      cmp = bTime - aTime; 
    }
    return sortOrder === "desc" ? -cmp : cmp;
  });

  allUpcoming.sort((a, b) => {
    const aTime = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0;
    const bTime = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0;
    return aTime - bTime;
  });

  console.log(`[VspoDex] Refresh complete: ${allLive.length} live, ${allUpcoming.length} upcoming (interval: ${intervalMinutes}m)`);

  await stores.liveStreams.set(allLive);
  await stores.upcomingStreams.set(allUpcoming);

  refreshActionBadge(allLive.length);
}

// ─── Past Streams Refresh ─────────────────────────────────

async function refreshPastStreams() {
  const settings = await stores.settings.get();
  const intervalMinutes = settings.general.pastStreamsRefreshInterval || 5;

  browser.alarms.create("refreshPastStreams", {
    periodInMinutes: intervalMinutes,
  });

  if (!navigator.onLine) {
    return;
  }

  const apiKey = await stores.holodexApiKey.get();
  if (!apiKey) return;

  try {
    const videos = await getPastStreams(0, 50);
    const followedChannels = await stores.followedChannels.get();
    const showCollab = settings.general.showCollabStreams || false;

    const followedSet = new Set(followedChannels);
    const filtered = showCollab
      ? videos
      : videos.filter((v) => followedSet.has(v.channel.id));

    const pastStreams: UnifiedStream[] = filtered.map((video) => {
      const unified = holodexToUnified(video);
      unified.status = "past";
      return unified;
    });

    await stores.pastStreams.set(pastStreams);
    await stores.pastStreamsOffset.set(50);

    console.log(`[VspoDex] Past streams refresh complete: ${pastStreams.length} past (interval: ${intervalMinutes}m)`);
  } catch (error) {
    console.error("[VspoDex] Past streams refresh error:", error);
  }
}

async function loadMorePastStreams() {
  const apiKey = await stores.holodexApiKey.get();
  if (!apiKey) return;

  const offset = await stores.pastStreamsOffset.get();
  const settings = await stores.settings.get();

  try {
    const videos = await getPastStreams(offset, 50);
    const followedChannels = await stores.followedChannels.get();
    const showCollab = settings.general.showCollabStreams || false;

    const followedSet = new Set(followedChannels);
    const filtered = showCollab
      ? videos
      : videos.filter((v) => followedSet.has(v.channel.id));

    const newStreams: UnifiedStream[] = filtered.map((video) => {
      const unified = holodexToUnified(video);
      unified.status = "past";
      return unified;
    });

    const existing = await stores.pastStreams.get();
    await stores.pastStreams.set([...existing, ...newStreams]);
    await stores.pastStreamsOffset.set(offset + 50);

    console.log(`[VspoDex] Loaded ${newStreams.length} more past streams (offset: ${offset + 50})`);
  } catch (error) {
    console.error("[VspoDex] Load more past streams error:", error);
  }
}

// ─── Alarm Handler ─────────────────────────────────────────

async function checkAlarm() {
  if (await browser.alarms.get("refresh")) {
    return;
  }

  refresh();
}

async function checkPastAlarm() {
  if (await browser.alarms.get("refreshPastStreams")) {
    return;
  }

  refreshPastStreams();
}

browser.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "refreshPastStreams") {
    refreshPastStreams();
  } else {
    refresh();
  }
});

// ─── Lifecycle ─────────────────────────────────────────────

browser.runtime.onInstalled.addListener(async () => {
  // On first install, try to refresh the VSPO channel list
  try {
    const apiKey = await stores.holodexApiKey.get();
    if (apiKey) {
      await refreshVspoChannels();
    }
  } catch {} // eslint-disable-line no-empty

  refresh();
  refreshPastStreams();
});

browser.runtime.onStartup.addListener(() => {
  refresh();
  refreshPastStreams();
});

// ─── Message Handler ───────────────────────────────────────

const messageHandlers: Record<string, Function> = {
  authorize,
  refresh: () => refresh(),
  refreshPastStreams: () => refreshPastStreams(),
  loadMorePastStreams: () => loadMorePastStreams(),
  request,
  revoke,
  refreshVspoChannels,
  fetchAndCacheChannels,
  getChannelsByOrg,
  getRedirectUrl,
  addCustomChannel,
  refreshSearchChannelsList,
};

browser.runtime.onMessage.addListener((message) => {
  const handler = get(messageHandlers, message.type);

  if (handler == null) {
    throw new RangeError(`Message handler not found: ${message.type}`);
  }

  return handler(...message.args);
});

// ─── React to store changes ────────────────────────────────

stores.twitchAccessToken.onChange(() => refresh());
stores.holodexApiKey.onChange(() => refresh());
stores.followedChannels.onChange(() => refresh());
stores.settings.onChange(() => refresh());

checkAlarm();
checkPastAlarm();
