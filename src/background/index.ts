import { get } from "es-toolkit/compat";

import { openUrl } from "~/common/helpers";
import { stores } from "~/common/stores";
import { HolodexVideo, HelixStream, UnifiedStream, HelixVideo, WatchlistItem, AutoOpenedStream } from "~/common/types";
import { DEFAULT_VSPO_CHANNELS } from "~/common/constants";

import { refreshActionBadge } from "./modules/badge";
import { getLiveStreams, getPastStreams, getChannelPastVideos, refreshVspoChannels, fetchAndCacheChannels, getChannelsByOrg, addCustomChannel, ensureCustomChannels, refreshSearchChannelsList, validateHolodexApiKey } from "./modules/holodex";
import {
  authorize,
  getCurrentUser,
  getStreams,
  getRedirectUrl,
  request,
  revoke,
  validate,
  getUserVideos,
  getUserVideosByLogin,
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
    startedAt: video.start_actual ?? video.available_at ?? null,
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

function twitchToUnified(stream: HelixStream, channelId: string, formattedName?: string): UnifiedStream {
  return {
    id: `twitch:${stream.id}`,
    channelId: channelId,
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
  const previousLive = await stores.liveStreams.get();
  const previousLiveIds = new Set(previousLive.map(s => s.id));
  const isFirstRefresh = await stores.isFirstRefresh.get();

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
            const channelId = hc ? hc.id : stream.userId;
            allLive.push(twitchToUnified(stream, channelId, formattedName));
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

  if (!isFirstRefresh) {
    const favoriteChannels = await stores.favoriteChannels.get();
    const autoOpenArmed = await stores.autoOpenFavoritesArmed.get();
    
    if (autoOpenArmed !== "disarmed") {
      const newlyLive = allLive.filter(s => !previousLiveIds.has(s.id));
      const liveFavorites = newlyLive.filter(s => favoriteChannels.includes(s.channelId));
      
      if (liveFavorites.length > 0) {
        const behavior = settings.general.autoOpenFavoritesBehavior || "background";
        const active = behavior === "active";
        
        const gracePeriodMs = (intervalMinutes + 2) * 60 * 1000;
        const now = Date.now();
        const validLiveFavorites = liveFavorites.filter(s => {
          if (!s.startedAt) return true;
          const startTime = new Date(s.startedAt).getTime();
          return (now - startTime) <= gracePeriodMs;
        });

        if (validLiveFavorites.length > 0) {
          const openedList = await stores.autoOpenedStreams.get();
          const newOpened = [...openedList];
          
          let streakAddedCount = 0;
          for (const stream of validLiveFavorites) {
            browser.tabs.create({ url: stream.url, active }).catch(err => {
              console.error("[VspoDex] Auto-open tab failed:", err);
            });
            newOpened.push({
              streamId: stream.id,
              channelId: stream.channelId,
              mode: autoOpenArmed === "streak" ? "streak" : "armed"
            });
            if (autoOpenArmed === "streak") {
              streakAddedCount++;
            }
          }
          
          await stores.autoOpenedStreams.set(newOpened);
          await stores.autoOpenFavoritesArmed.set("disarmed");

          if (streakAddedCount > 0) {
            const currentCount = await stores.streakCount.get();
            await stores.streakCount.set(currentCount + streakAddedCount);
          }
        }
      }
    }

    const watchlist = await stores.watchlistStreams.get();
    if (watchlist.length > 0) {
      const behavior = settings.general.autoOpenFavoritesBehavior || "background";
      const active = behavior === "active";
      
      let updatedWatchlist = [...watchlist];
      let watchlistChanged = false;
      
      for (const watchItem of watchlist) {
        const isLive = allLive.some(s => s.id === watchItem.id);
        if (isLive) {
          browser.tabs.create({ url: watchItem.url, active }).catch(err => {
            console.error("[VspoDex] Watchlist auto-open tab failed:", err);
          });
          
          const favoriteChannels = await stores.favoriteChannels.get();
          if (favoriteChannels.includes(watchItem.channelId)) {
            const armedState = await stores.autoOpenFavoritesArmed.get();
            if (armedState !== "disarmed") {
              const disarm = settings.general.disarmOnWatchlistLaunch !== false;
              if (disarm) {
                await stores.autoOpenFavoritesArmed.set("disarmed");
                console.log(`[VspoDex] Watchlist: Disarmed auto-open trigger since favorite ${watchItem.channelName} was opened by live transition.`);
              }
              
              const openedList = await stores.autoOpenedStreams.get();
              await stores.autoOpenedStreams.set([
                ...openedList,
                { streamId: watchItem.id, channelId: watchItem.channelId, mode: armedState === "streak" ? "streak" : "armed" }
              ]);

              if (armedState === "streak") {
                const currentCount = await stores.streakCount.get();
                await stores.streakCount.set(currentCount + 1);
              }
            }
          }

          browser.alarms.clear(watchItem.id).catch(() => {});
          updatedWatchlist = updatedWatchlist.filter(item => item.id !== watchItem.id);
          watchlistChanged = true;
        }
      }
      
      if (watchlistChanged) {
        await stores.watchlistStreams.set(updatedWatchlist);
      }
    }

    const autoOpened = await stores.autoOpenedStreams.get();
    if (autoOpened.length > 0 && settings.general.autoRearmFavorites) {
      let updatedAutoOpened = [...autoOpened];
      let changed = false;
      
      for (const item of autoOpened) {
        const isStillLive = allLive.some(s => s.id === item.streamId);
        if (!isStillLive) {
          console.log(`[VspoDex] Auto-rearm: Stream ${item.streamId} went offline. Triggering cycle/re-arm...`);
          await cycleToNextFavorite(item.streamId, item.mode);
          updatedAutoOpened = updatedAutoOpened.filter(x => x.streamId !== item.streamId);
          changed = true;
        }
      }
      
      if (changed) {
        await stores.autoOpenedStreams.set(updatedAutoOpened);
      }
    }
  }

  await stores.isFirstRefresh.set(false);
}

// ─── Past Streams Refresh ─────────────────────────────────

function parseTwitchDuration(durationStr: string): number {
  if (!durationStr) return 0;
  let totalSeconds = 0;
  const matches = durationStr.match(/(\d+[hms])/g);
  if (!matches) return 0;
  for (const part of matches) {
    const val = parseInt(part.slice(0, -1), 10);
    const unit = part.slice(-1);
    if (unit === "h") totalSeconds += val * 3600;
    else if (unit === "m") totalSeconds += val * 60;
    else if (unit === "s") totalSeconds += val;
  }
  return totalSeconds;
}

function twitchVideoToUnified(video: HelixVideo, channelId: string, channelAvatar: string | null): UnifiedStream {
  return {
    id: `twitch:${video.id}`,
    channelId: channelId,
    title: video.title,
    channelName: video.userName,
    channelAvatar: channelAvatar,
    viewerCount: null,
    startedAt: video.publishedAt || video.createdAt || null,
    scheduledAt: null,
    status: "past",
    source: "twitch",
    url: video.url || `https://twitch.tv/videos/${video.id}`,
    thumbnailUrl: video.thumbnailUrl
      ? video.thumbnailUrl
          .replace("%{width}", "320")
          .replace("%{height}", "180")
          .replace("{width}", "320")
          .replace("{height}", "180")
      : null,
    duration: parseTwitchDuration(video.duration),
  };
}

const EXPERIMENTAL_TWITCH_USERS = [
  { id: "584184005", login: "akarindao" },
  { id: "858359149", login: "ramuneshiranami" },
  { id: "773185713", login: "shinomiya_runa" },
  { id: "722162135", login: "ren_kisaragi__" },
];

async function refreshPastTwitchStreams() {
  const hasToken = await stores.twitchAccessToken.get();
  if (!hasToken) {
    console.log("[VspoDex] Twitch Past: No access token, skipping.");
    await stores.pastTwitchStreams.set([]);
    return;
  }

  try {
    const isValid = await validate();
    if (!isValid) {
      console.warn("[VspoDex] Twitch Past: Token invalid or expired.");
      await stores.pastTwitchStreams.set([]);
      return;
    }

    const allVideosPromises = EXPERIMENTAL_TWITCH_USERS.map(async (user) => {
      try {
        const videos = await getUserVideos(user.id);
        return videos;
      } catch (err) {
        console.error(`[VspoDex] Twitch Past: Error fetching VODs for ${user.login} (${user.id}):`, err);
        return [];
      }
    });

    const videosResults = await Promise.all(allVideosPromises);
    const flatVideos = videosResults.flat();

    const cachedChannels = await stores.channelCache.get();
    const defaultTwitchMap = new Map(DEFAULT_VSPO_CHANNELS.map(c => [c.twitch?.toLowerCase(), c.id]));

    const unifiedVideos = flatVideos.map((video) => {
      const hc = cachedChannels.find(
        c => c.twitch?.toLowerCase() === video.userLogin.toLowerCase()
          || defaultTwitchMap.get(video.userLogin.toLowerCase()) === c.id
      );
      const channelId = hc ? hc.id : video.userId;
      return twitchVideoToUnified(video, channelId, null);
    });

    unifiedVideos.sort((a, b) => {
      const aTime = a.startedAt ? new Date(a.startedAt).getTime() : 0;
      const bTime = b.startedAt ? new Date(b.startedAt).getTime() : 0;
      return bTime - aTime;
    });

    await stores.pastTwitchStreams.set(unifiedVideos);
    console.log(`[VspoDex] Past Twitch streams refresh complete: ${unifiedVideos.length} videos fetched.`);
  } catch (error) {
    console.error("[VspoDex] Twitch Past streams refresh error:", error);
  }
}

// ─── Per-Channel Past Stream Handlers ──────────────────────

async function getChannelPastStreams(channelId: string): Promise<UnifiedStream[]> {
  const videos = await getChannelPastVideos(channelId);
  return videos.map((video) => {
    const unified = holodexToUnified(video);
    unified.status = "past";
    return unified;
  });
}

async function getChannelPastTwitchStreams(twitchLogin: string): Promise<UnifiedStream[]> {
  const hasToken = await stores.twitchAccessToken.get();
  if (!hasToken) return [];

  const isValid = await validate();
  if (!isValid) return [];

  try {
    const videos = await getUserVideosByLogin(twitchLogin);
    const cachedChannels = await stores.channelCache.get();
    const defaultTwitchMap = new Map(DEFAULT_VSPO_CHANNELS.map(c => [c.twitch?.toLowerCase(), c.id]));
    
    const hc = cachedChannels.find(
      c => c.twitch?.toLowerCase() === twitchLogin.toLowerCase()
        || defaultTwitchMap.get(twitchLogin.toLowerCase()) === c.id
    );
    const channelId = hc ? hc.id : (videos[0]?.userId || "");

    return videos.map((video) => twitchVideoToUnified(video, channelId, null));
  } catch (error) {
    console.error(`[VspoDex] Error fetching Twitch past streams for ${twitchLogin}:`, error);
    return [];
  }
}

async function refreshPastStreams() {
  const settings = await stores.settings.get();
  const intervalMinutes = settings.general.pastStreamsRefreshInterval || 5;

  browser.alarms.create("refreshPastStreams", {
    periodInMinutes: intervalMinutes,
  });

  if (!navigator.onLine) {
    return;
  }

  // Refresh Holodex past streams
  const apiKey = await stores.holodexApiKey.get();
  if (apiKey) {
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

  // Refresh Twitch past streams if enabled
  if (settings.general.enableExperimentalTwitchPast !== false) {
    await refreshPastTwitchStreams();
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

async function handleWatchlistAlarm(alarmName: string) {
  const list = await stores.watchlistStreams.get();
  const item = list.find(x => x.id === alarmName);
  if (!item) {
    return;
  }
  
  const settings = await stores.settings.get();
  const behavior = settings.general.autoOpenFavoritesBehavior || "background";
  const active = behavior === "active";
  
  browser.tabs.create({ url: item.url, active }).catch(err => {
    console.error("[VspoDex] Watchlist alarm auto-open failed:", err);
  });
  
  const favoriteChannels = await stores.favoriteChannels.get();
  if (favoriteChannels.includes(item.channelId)) {
    const armedState = await stores.autoOpenFavoritesArmed.get();
    if (armedState !== "disarmed") {
      const disarm = settings.general.disarmOnWatchlistLaunch !== false;
      if (disarm) {
        await stores.autoOpenFavoritesArmed.set("disarmed");
        console.log(`[VspoDex] Watchlist: Disarmed auto-open trigger since favorite ${item.channelName} was opened by alarm.`);
      }
      
      const openedList = await stores.autoOpenedStreams.get();
      await stores.autoOpenedStreams.set([
        ...openedList,
        { streamId: item.id, channelId: item.channelId, mode: armedState === "streak" ? "streak" : "armed" }
      ]);
    }
  }
  
  const updatedList = list.filter(x => x.id !== alarmName);
  await stores.watchlistStreams.set(updatedList);
}

async function restoreWatchlistAlarms() {
  const list = await stores.watchlistStreams.get();
  const now = Date.now();
  for (const item of list) {
    const scheduledTime = new Date(item.scheduledAt).getTime();
    if (scheduledTime > now) {
      await browser.alarms.create(item.id, { when: scheduledTime });
      console.log(`[VspoDex] Restored alarm for ${item.id} at ${new Date(scheduledTime).toLocaleString()}`);
    } else {
      console.log(`[VspoDex] Watchlist stream ${item.id} scheduled time already passed, cleaning up.`);
      const currentList = await stores.watchlistStreams.get();
      await stores.watchlistStreams.set(currentList.filter(x => x.id !== item.id));
    }
  }
}

async function toggleWatchlist(stream: UnifiedStream) {
  const list = await stores.watchlistStreams.get();
  const exists = list.some(item => item.id === stream.id);
  let updatedList = [...list];
  
  if (exists) {
    updatedList = list.filter(item => item.id !== stream.id);
    await browser.alarms.clear(stream.id);
    console.log(`[VspoDex] Watchlist: Removed ${stream.id} and cleared alarm.`);
  } else {
    const scheduledTime = stream.scheduledAt ? new Date(stream.scheduledAt).getTime() : Date.now();
    const watchItem: WatchlistItem = {
      id: stream.id,
      channelId: stream.channelId,
      title: stream.title,
      channelName: stream.channelName,
      url: stream.url,
      scheduledAt: stream.scheduledAt || new Date().toISOString(),
    };
    updatedList.push(watchItem);
    await browser.alarms.create(stream.id, { when: scheduledTime });
    console.log(`[VspoDex] Watchlist: Added ${stream.id} and set alarm for ${new Date(scheduledTime).toLocaleString()}.`);
  }
  await stores.watchlistStreams.set(updatedList);
}

async function toggleStreak(stream: UnifiedStream, skipOpen?: boolean) {
  const settings = await stores.settings.get();
  const list = await stores.autoOpenedStreams.get();
  const exists = list.some(item => item.streamId === stream.id && item.mode === "streak");
  
  if (exists) {
    if (skipOpen) {
      return;
    }
    const updated = list.filter(item => item.streamId !== stream.id);
    await stores.autoOpenedStreams.set(updated);
    console.log(`[VspoDex] Streak: Removed ${stream.id} from streak tracking.`);
    if (updated.filter(item => item.mode === "streak").length === 0) {
      await stores.streakCount.set(0);
    }
  } else {
    if (!skipOpen) {
      const behavior = settings.general.autoOpenFavoritesBehavior || "background";
      const active = behavior === "active";
      
      browser.tabs.create({ url: stream.url, active }).catch(err => {
        console.error("[VspoDex] Streak click failed to open tab:", err);
      });
    }
    
    await stores.autoOpenedStreams.set([
      { streamId: stream.id, channelId: stream.channelId, mode: "streak" }
    ]);
    
    await stores.autoOpenFavoritesArmed.set("disarmed");
    await stores.streakCount.set(1);
    console.log(`[VspoDex] Streak: Overrode tracking with ${stream.id} and opened stream.`);
  }
}

async function cancelStreakTracking() {
  await stores.autoOpenedStreams.set([]);
  await stores.autoOpenFavoritesArmed.set("disarmed");
  await stores.streakCount.set(0);
  console.log("[VspoDex] Streak: Cancelled all active streak tracking.");
}

async function cycleToNextFavorite(endedStreamId: string, endedStreamMode: "armed" | "streak") {
  if (endedStreamMode !== "streak") {
    return;
  }

  await stores.autoOpenFavoritesArmed.set("streak");
  console.log("[VspoDex] Auto-rearm: Re-armed favorites auto-open trigger to streak mode.");

  const settings = await stores.settings.get();
  if (!settings.general.autoRearmFavorites) {
    return;
  }

  const maxStreak = settings.general.maxStreak ?? 3;
  const currentCount = await stores.streakCount.get();
  if (maxStreak !== 0 && currentCount >= maxStreak) {
    console.log(`[VspoDex] Auto-rearm: Streak limit reached (${currentCount}/${maxStreak}). Stopping streak.`);
    await cancelStreakTracking();
    return;
  }

  const allLive = await stores.liveStreams.get();
  const favoriteChannels = await stores.favoriteChannels.get();
  const autoOpened = await stores.autoOpenedStreams.get();
  const activeOpenedIds = new Set(autoOpened.map(x => x.streamId));

  const candidates = allLive.filter(s => 
    favoriteChannels.includes(s.channelId) && 
    s.id !== endedStreamId && 
    !activeOpenedIds.has(s.id)
  );

  if (candidates.length > 0) {
    const nextStream = candidates[0];
    const behavior = settings.general.autoOpenFavoritesBehavior || "background";
    const active = behavior === "active";

    console.log(`[VspoDex] Auto-rearm: Cycling to next live favorite stream ${nextStream.id} (${nextStream.channelName})`);
    browser.tabs.create({ url: nextStream.url, active }).catch(err => {
      console.error("[VspoDex] Auto-rearm cycle failed to open tab:", err);
    });
    
    await stores.autoOpenedStreams.set([
      ...autoOpened,
      { streamId: nextStream.id, channelId: nextStream.channelId, mode: "streak" }
    ]);
    await stores.autoOpenFavoritesArmed.set("disarmed");
    await stores.streakCount.set(currentCount + 1);
  }
}

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
  } else if (alarm.name === "refresh") {
    refresh();
  } else {
    handleWatchlistAlarm(alarm.name);
  }
});

// ─── Lifecycle ─────────────────────────────────────────────

browser.runtime.onInstalled.addListener(async (details) => {
  try {
    const rawArmed = await browser.storage.local.get("autoOpenFavoritesArmed");
    const val = rawArmed.autoOpenFavoritesArmed;
    if (typeof val === "boolean") {
      await browser.storage.local.set({
        autoOpenFavoritesArmed: val ? "armed" : "disarmed"
      });
      console.log(`[VspoDex] Migration: Converted autoOpenFavoritesArmed from boolean ${val} to string.`);
    }
  } catch (err) {
    console.error("[VspoDex] Migration: failed to convert autoOpenFavoritesArmed:", err);
  }

  if (details.reason === "update") {
    try {
      const ID_MIGRATION_MAP: Record<string, string> = {
        "UCuI5XaO-6grGrTTLw8sF_Fg": "UCyLGcqYs7RsBb3L0SJfzGYA", // Sumire Kaga
        "UCyLGcqYs7RsBb3L0SJfzGYA": "UCiMG6VdScBabPhJ1ZtaVmbw", // Nazuna Kaga
        "UCvUc0m317LWTTPZoBQV479A": "UCgTzsBI0DIRopMylJEDqnog", // Toto Kogara
        "UC61OwuYOVuKkpKnid-43Twg": "UC5LyYg6cCA4yHEYvtUsir3g", // Uruha Ichinose
        "UCgTzsBI0DIRopMylJEDqnog": "UCIcAj6WkJ8vZ7DeJVgmeqKw", // Noa Kurumi
        "UCF_U2GCKHvDz52jWdizppIA": "UCvUc0m317LWTTPZoBQV479A", // Hinano Tachibana
        "UCIjdfjcSaEgdjwbgjlC3-Pg": "UCD5W21JqNMv_tV9nfjvF9sw", // Runa Shinomiya
        "UCD5W21JqNMv_tV9nfjvF9sw": "UCurEA8YoqFwimJcAuSHU0MQ", // Lisa Hanabusa
        "UCurEA8YoqFwimJcAuSHU0MQ": "UCMp55EbT_ZlqiMS3lCj01BQ", // Kyupi Kaminari
        "UCMp55EbT_ZlqiMS3lCj01BQ": "UCjXBuHmWkieBApgBhDuJMMQ", // Beni Yakumo
        "UC5LyYg6cCA4lHEYqPC7Wrqg": "UCPkKpOHxEDcwmUAnRpIu-Ng", // Ema Aizawa
        "UCs5l2HmRlPk-8LA3dNaYJw": "UCF_U2GCKHvDz52jWdizppIA", // Sena Asumi
        "UCXU7YYxy_iQd3ulXyO-zC-Q": "UCGWa1dMU_sDCaRQjdabsVgg", // Ren Kisaragi
      };

      // 1. Migrate followedChannels IDs
      const followed = await stores.followedChannels.get();
      let followedPatched = false;
      const newFollowed = followed.map(id => {
        if (ID_MIGRATION_MAP[id]) {
          followedPatched = true;
          return ID_MIGRATION_MAP[id];
        }
        return id;
      });
      const uniqueFollowed = Array.from(new Set(newFollowed));
      if (followedPatched || uniqueFollowed.length !== followed.length) {
        await stores.followedChannels.set(uniqueFollowed);
        console.log("[VspoDex] Migration: patched followedChannels IDs.");
      }

      // 2. Migrate channelCache IDs and twitch logins
      const cached = await stores.channelCache.get();
      let cachePatched = false;
      const defaultTwitchMap = new Map(DEFAULT_VSPO_CHANNELS.map(c => [c.id, c.twitch]));

      const newCache = cached.map(ch => {
        let updatedCh = { ...ch };
        if (ID_MIGRATION_MAP[ch.id]) {
          updatedCh.id = ID_MIGRATION_MAP[ch.id];
          cachePatched = true;
        }
        if (defaultTwitchMap.has(updatedCh.id)) {
          const correctTwitch = defaultTwitchMap.get(updatedCh.id);
          if (updatedCh.twitch !== correctTwitch) {
            updatedCh.twitch = correctTwitch;
            cachePatched = true;
          }
        }
        return updatedCh;
      });

      if (cachePatched) {
        await stores.channelCache.set(newCache);
        console.log("[VspoDex] Migration: patched channelCache IDs and twitch logins.");
      }
    } catch (e) {
      console.error("[VspoDex] Migration: failed to patch channels and cache:", e);
    }
  }

  // On first install or update, try to refresh the VSPO channel list
  try {
    const apiKey = await stores.holodexApiKey.get();
    if (apiKey) {
      await refreshVspoChannels();
    }
  } catch {} // eslint-disable-line no-empty

  refresh();
  refreshPastStreams();
  restoreWatchlistAlarms().catch(err => console.error("[VspoDex] Restore watchlist alarms failed:", err));
});

browser.runtime.onStartup.addListener(() => {
  refresh();
  refreshPastStreams();
  restoreWatchlistAlarms().catch(err => console.error("[VspoDex] Restore watchlist alarms failed:", err));
});

// ─── Commands Handler ──────────────────────────────────────

browser.commands.onCommand.addListener(async (command) => {
  let path = "";
  if (command === "open_live_tab") {
    path = "/streams/live";
  } else if (command === "open_member_tab") {
    path = "/streams/members";
  } else if (command === "open_past_tab") {
    path = "/streams/past";
  }

  if (path) {
    // Initiate popup opening synchronously within the gesture-triggered call stack to preserve gesture token in Chrome
    const openPromise = (browser.action && typeof browser.action.openPopup === "function")
      ? browser.action.openPopup()
      : Promise.resolve();

    await stores.targetTab.set(path);

    try {
      await openPromise;
    } catch (err) {
      console.error("[VspoDex] Failed to open popup:", err);
    }
  }
});

// ─── Tab Removal Listener (Removed) ────────────────────────

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
  getChannelPastStreams,
  getChannelPastTwitchStreams,
  validateHolodexApiKey,
  toggleWatchlist,
  toggleStreak,
  cancelStreakTracking,
};

browser.runtime.onMessage.addListener((message) => {
  const handler = get(messageHandlers, message.type);

  if (handler == null) {
    throw new RangeError(`Message handler not found: ${message.type}`);
  }

  return handler(...message.args);
});

// ─── React to store changes ────────────────────────────────

stores.twitchAccessToken.onChange(() => {
  refresh();
  refreshPastStreams();
});
stores.holodexApiKey.onChange(() => {
  refresh();
  refreshPastStreams();
});
stores.followedChannels.onChange(() => {
  refresh();
  refreshPastStreams();
});
stores.settings.onChange(() => {
  refresh();
  refreshPastStreams();
});

checkAlarm();
checkPastAlarm();
