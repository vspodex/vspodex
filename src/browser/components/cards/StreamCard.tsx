import { useMemo } from "react";
import tw, { styled } from "twin.macro";

import { UnifiedStream } from "~/common/types";
import { useNow } from "~/browser/hooks";
import { formatTime } from "~/browser/helpers";

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

const Wrapper = styled(Card)`
  ${tw`py-2 relative`}

  :hover {
    ${tw`opacity-100`}
  }
`;

// ─── Component ─────────────────────────────────────────────

export interface StreamCardProps {
  stream: UnifiedStream;
}

function StreamCard(props: StreamCardProps) {
  const { stream } = props;
  const currentTime = useNow(60_000);

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
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }, [stream.scheduledAt]);

  return (
    <Anchor to={stream.url}>
      <Wrapper
        title={
          <Title>
            <ChannelName>{stream.channelName}</ChannelName>
            {stream.status === "live" && formattedViewers && (
              <ViewerCount>🔴 {formattedViewers}</ViewerCount>
            )}
            {stream.status === "upcoming" && scheduledTime && (
              <ViewerCount>🕐 {scheduledTime}</ViewerCount>
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
      </Wrapper>
    </Anchor>
  );
}

export default StreamCard;
