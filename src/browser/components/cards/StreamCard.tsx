import { useMemo } from "react";
import tw, { styled } from "twin.macro";
import { IconClock, IconAlarm, IconBolt } from "@tabler/icons-react";

import { UnifiedStream } from "~/common/types";
import { useNow, useWatchlistStreams, useTranslation, useAutoOpenedStreams, useSettings } from "~/browser/hooks";
import { formatTime } from "~/browser/helpers";
import { sendRuntimeMessage, openUrl } from "~/common/helpers";

import Anchor from "../Anchor";
import Card from "../Card";

// ─── Styled Components ─────────────────────────────────────

const Thumbnail = styled.div`
  ${tw`bg-black overflow-hidden relative rounded w-24 flex-none`}
`;

const ThumbnailImg = styled.img`
  ${tw`w-full h-full object-cover`}
  aspect-ratio: 16 / 9;
`;

const AvatarFallback = styled.div`
  ${tw`w-24 h-[54px] bg-neutral-700 flex items-center justify-center`}
`;

const AvatarImg = styled.img`
  ${tw`w-8 h-8 rounded-full`}
`;

const UptimeBadge = styled.div`
  ${tw`absolute bg-black/75 bottom-0 font-medium px-1 end-0 rounded-ss tabular-nums text-sm text-white`}
`;

const LiveBadge = styled.div`
  ${tw`absolute bg-red-600 top-1 start-1 px-1 rounded text-xs font-bold text-white uppercase`}
`;

const Title = styled.div`
  ${tw`flex gap-2`}
`;

const ChannelName = styled.span`
  ${tw`flex-1 truncate font-medium`}
`;

const ViewerCount = styled.span`
  ${tw`flex-none text-black dark:text-white text-sm tabular-nums`}
`;

const StreamTitle = styled.div`
  ${tw`truncate`}
`;

const SourceBadge = styled.span<{ source: string }>`
  ${tw`text-xs px-1 rounded font-medium`}
  ${(props) =>
    props.source === "twitch"
      ? tw`bg-purple-600/20 text-purple-400`
      : tw`bg-red-600/20 text-red-400`}
`;

const Wrapper = styled(Card)<{ isUpcoming?: boolean; isLive?: boolean }>`
  ${tw`py-2 relative`}
  ${(props) => (props.isUpcoming || props.isLive) && tw`pe-10`}

  :hover {
    ${tw`opacity-100`}
  }
`;

const WatchlistButton = styled.button<{ active: boolean }>`
  ${tw`absolute top-2 flex items-center justify-center w-7 h-7 rounded-full border border-neutral-200 dark:border-neutral-700 transition-all hover:scale-105 active:scale-95 cursor-pointer outline-none z-10`}
  right: 0.625rem;
  ${(props) => props.active 
    ? tw`bg-sky-500 border-transparent text-white hover:bg-sky-600 hover:text-white` 
    : tw`bg-white/80 dark:bg-neutral-800/80 text-neutral-400 hover:text-indigo-500`}
`;

const StreakButton = styled.button<{ active: boolean }>`
  ${tw`absolute top-2 flex items-center justify-center w-7 h-7 rounded-full border border-neutral-200 dark:border-neutral-700 transition-all hover:scale-105 active:scale-95 cursor-pointer outline-none z-10`}
  right: 0.625rem;
  ${(props) => props.active 
    ? tw`bg-amber-500 border-transparent text-white hover:bg-amber-600 hover:text-white` 
    : tw`bg-white/80 dark:bg-neutral-800/80 text-neutral-400 hover:text-amber-500`}
`;

// ─── Component ─────────────────────────────────────────────

export interface StreamCardProps {
  stream: UnifiedStream;
}

function StreamCard(props: StreamCardProps) {
  const { stream } = props;
  const currentTime = useNow(60_000);
  const [watchlist] = useWatchlistStreams();
  const [autoOpened] = useAutoOpenedStreams();
  const [settings] = useSettings();
  const { t } = useTranslation();

  const inWatchlist = useMemo(() => {
    return watchlist?.some((item) => item.id === stream.id) ?? false;
  }, [watchlist, stream.id]);

  const isCurrentStreak = useMemo(() => {
    return autoOpened?.some((item) => item.streamId === stream.id && item.mode === "streak") ?? false;
  }, [autoOpened, stream.id]);

  const shouldOpenUntracked = useMemo(() => {
    return (
      !isCurrentStreak &&
      !!settings.general.autoRearmFavorites &&
      !!settings.general.streakModeForManualOpen &&
      !!settings.general.trackMultipleStreams
    );
  }, [isCurrentStreak, settings.general.autoRearmFavorites, settings.general.streakModeForManualOpen, settings.general.trackMultipleStreams]);

  const handleWatchlistClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await sendRuntimeMessage("toggleWatchlist", stream);
    } catch (err) {
      console.error("[VspoDex] Failed to toggle watchlist:", err);
    }
  };

  const handleStreakClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (shouldOpenUntracked) {
        await openUrl(stream.url, e);
      } else if (!isCurrentStreak) {
        await sendRuntimeMessage("toggleStreak", stream, true);
        await openUrl(stream.url, e);
      } else {
        await sendRuntimeMessage("toggleStreak", stream);
      }
    } catch (err) {
      console.error("[VspoDex] Failed to toggle streak mode:", err);
    }
  };

  const handleCardClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const isStreakTriggered =
      stream.status === "live" &&
      settings.general.autoRearmFavorites &&
      settings.general.streakModeForManualOpen;

    if (isStreakTriggered) {
      try {
        await sendRuntimeMessage("toggleStreak", stream, true);
      } catch (err) {
        console.error("[VspoDex] Failed to toggle streak mode on card click:", err);
      }
    }
    await openUrl(stream.url, e);
  };

  const uptime = useMemo(() => {
    if (!stream.startedAt) return null;

    const startDate = new Date(stream.startedAt);
    const diff = currentTime.getTime() - startDate.getTime();

    if (diff < 0) return null;

    return formatTime(diff, false);
  }, [stream.startedAt, currentTime]);

  const formattedViewers = useMemo(() => {
    if (stream.viewerCount == null) return null;

    if (stream.viewerCount >= 1000) {
      return `${(stream.viewerCount / 1000).toFixed(1)}K`;
    }

    return String(stream.viewerCount);
  }, [stream.viewerCount]);

  const scheduledTime = useMemo(() => {
    if (!stream.scheduledAt) return null;

    const date = new Date(stream.scheduledAt);
    const diff = date.getTime() - currentTime.getTime();
    if (diff > 86400000) {
      return date.toLocaleString([], {
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }, [stream.scheduledAt, currentTime]);

  // Duration formatted for past streams (e.g. "1:32:05" → "1:32")
  const formattedDuration = useMemo(() => {
    if (stream.status !== "past" || !stream.duration) return null;
    const hours = Math.floor(stream.duration / 3600);
    const minutes = Math.floor((stream.duration % 3600) / 60);
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, "0")}`;
    }
    return `${minutes}m`;
  }, [stream.status, stream.duration]);

  // Relative end time for past streams
  const endedAgo = useMemo(() => {
    if (stream.status !== "past") return null;
    // Use startedAt + duration, or fall back to scheduledAt
    let endDate: Date | null = null;
    if (stream.startedAt && stream.duration) {
      endDate = new Date(new Date(stream.startedAt).getTime() + stream.duration * 1000);
    } else if (stream.scheduledAt) {
      endDate = new Date(stream.scheduledAt);
    }
    if (!endDate) return null;

    const diff = currentTime.getTime() - endDate.getTime();
    if (diff < 60000) return "<1m";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return `${Math.floor(diff / 86400000)}d`;
  }, [stream.status, stream.startedAt, stream.duration, stream.scheduledAt, currentTime]);

  return (
    <Anchor
      to={stream.url}
      onClick={handleCardClick}
      onAuxClick={handleCardClick}
    >
      <Wrapper
        isUpcoming={stream.status === "upcoming"}
        isLive={stream.status === "live" && settings.general.autoRearmFavorites === true}
        title={
          <Title>
            <ChannelName>{stream.channelName}</ChannelName>
            {stream.status === "live" && formattedViewers && (
              <ViewerCount>🔴 {formattedViewers}</ViewerCount>
            )}
            {stream.status === "upcoming" && scheduledTime && (
              <ViewerCount>🕐 {scheduledTime}</ViewerCount>
            )}
            {stream.status === "past" && endedAgo && (
              <ViewerCount>📁 {endedAgo}</ViewerCount>
            )}
          </Title>
        }
        subtitle={
          <StreamTitle title={stream.title}>
            {stream.title || <i>No title</i>}
          </StreamTitle>
        }
        leftOrnament={
          <Thumbnail>
            {stream.thumbnailUrl ? (
              <ThumbnailImg src={stream.thumbnailUrl} alt="" />
            ) : stream.channelAvatar ? (
              <AvatarFallback>
                <AvatarImg src={stream.channelAvatar} alt="" />
              </AvatarFallback>
            ) : (
              <AvatarFallback />
            )}
            {stream.status === "live" && <LiveBadge>LIVE</LiveBadge>}
            {stream.status === "live" && uptime && (
              <UptimeBadge>{uptime}</UptimeBadge>
            )}
            {stream.status === "past" && formattedDuration && (
              <UptimeBadge>{formattedDuration}</UptimeBadge>
            )}
          </Thumbnail>
        }
      >
        <SourceBadge source={stream.source}>
          {stream.source === "twitch" ? "Twitch" : "YouTube"}
        </SourceBadge>
        {stream.gameName && (
          <span> · {stream.gameName}</span>
        )}
        {stream.topicId && !stream.gameName && (
          <span> · {stream.topicId}</span>
        )}

        {stream.status === "upcoming" && (
          <WatchlistButton
            active={inWatchlist}
            onClick={handleWatchlistClick}
            title={inWatchlist ? t("tooltip_watchlist_remove") : t("tooltip_watchlist_add")}
          >
            {inWatchlist ? <IconAlarm size="1.1rem" /> : <IconClock size="1.1rem" />}
          </WatchlistButton>
        )}

        {stream.status === "live" && settings.general.autoRearmFavorites && (
          <StreakButton
            active={isCurrentStreak}
            onClick={handleStreakClick}
            title={
              isCurrentStreak
                ? t("tooltip_streak_remove")
                : shouldOpenUntracked
                ? t("tooltip_streak_untracked")
                : t("tooltip_streak_add")
            }
          >
            <IconBolt size="1.1rem" fill={isCurrentStreak ? "currentColor" : "none"} />
          </StreakButton>
        )}
      </Wrapper>
    </Anchor>
  );
}

export default StreamCard;
