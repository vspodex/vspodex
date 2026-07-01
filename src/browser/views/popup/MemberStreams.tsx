import { useState, useMemo, useCallback } from "react";
import tw, { styled } from "twin.macro";

import { sendRuntimeMessage, formatChannelName } from "~/common/helpers";
import { HolodexChannel, UnifiedStream } from "~/common/types";
import { DEFAULT_VSPO_CHANNELS, VSPO_DEBUT_ORDER } from "~/common/constants";
import {
  useFollowedChannels,
  useChannelCache,
  useTranslation,
  useFavoriteChannels,
} from "~/browser/hooks";

import StreamCard from "~/browser/components/cards/StreamCard";
import Layout from "~/browser/components/Layout";
import Splash from "~/browser/components/Splash";
import Anchor from "~/browser/components/Anchor";

// ─── Styled Components: Member Grid ────────────────────────

const Header = styled.div`
  ${tw`px-4 py-3 text-sm font-medium text-neutral-500 uppercase tracking-wider border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between`}
`;

const BackButton = styled.button`
  ${tw`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:(text-indigo-700 dark:text-indigo-300 bg-indigo-500/10 dark:bg-indigo-500/20) cursor-pointer transition-colors bg-transparent border-none outline-none`}
`;

const MemberGrid = styled.div`
  ${tw`grid gap-4 p-4`}
  grid-template-columns: repeat(3, minmax(0, 1fr));
`;

const MemberItem = styled.button`
  ${tw`flex flex-col items-center gap-1.5 bg-transparent border-none cursor-pointer p-1 rounded-lg transition-colors hover:(bg-neutral-200 dark:bg-neutral-800) outline-none`}
`;

const AvatarCircle = styled.img`
  ${tw`w-14 h-14 rounded-full object-cover flex-none border-2 border-transparent transition-all`}

  ${MemberItem}:hover & {
    ${tw`border-indigo-500 scale-110`}
  }
`;

const AvatarPlaceholder = styled.div`
  ${tw`w-14 h-14 rounded-full flex-none bg-neutral-300 dark:bg-neutral-600 flex items-center justify-center text-base font-semibold border-2 border-transparent transition-all`}

  ${MemberItem}:hover & {
    ${tw`border-indigo-500 scale-110`}
  }
`;

const MemberName = styled.span`
  ${tw`text-sm font-semibold text-center truncate w-full text-neutral-800 dark:text-neutral-200 leading-tight`}
`;

const GroupLabel = styled.div`
  ${tw`col-span-full text-xs font-semibold text-neutral-400 uppercase tracking-wider pt-2 first:pt-0`}
`;

const StreamList = styled.div``;

// ─── Styled Components: Packed Favorites ───────────────────
const FavoriteGrid = styled.div`
  ${tw`grid gap-2 col-span-full mb-3`}
  grid-template-columns: repeat(5, minmax(0, 1fr));
`;

const FavoriteItem = styled.button`
  ${tw`flex flex-col items-center justify-center bg-transparent border-none cursor-pointer p-1 rounded-lg transition-colors hover:(bg-neutral-200 dark:bg-neutral-800) outline-none`}
`;

const FavoriteAvatarCircle = styled.img`
  ${tw`w-12 h-12 rounded-full object-cover flex-none border-2 border-transparent transition-all`}

  ${FavoriteItem}:hover & {
    ${tw`border-indigo-500 scale-105`}
  }
`;

const FavoriteAvatarPlaceholder = styled.div`
  ${tw`w-12 h-12 rounded-full flex-none bg-neutral-300 dark:bg-neutral-600 flex items-center justify-center text-sm font-semibold border-2 border-transparent transition-all`}

  ${FavoriteItem}:hover & {
    ${tw`border-indigo-500 scale-105`}
  }
`;

// ─── Styled Components: Holodex-style Channel Header ──────────
const ChannelHeaderContainer = styled.div`
  ${tw`relative flex flex-col border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/30`}
`;

const HeaderBar = styled.div`
  ${tw`flex items-center justify-between px-3 py-1.5 border-b border-neutral-100 dark:border-neutral-800/60`}
`;

const HeaderBackButton = styled.button`
  ${tw`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:(text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 dark:bg-indigo-500/20) cursor-pointer transition-colors bg-transparent border-none outline-none`}
`;

const ChannelHeaderMain = styled.div`
  ${tw`flex justify-between items-center px-4 py-4 gap-3`}
`;

const ChannelInfoLeft = styled.div`
  ${tw`flex items-center gap-3`}
`;

const ChannelAvatar = styled.img`
  ${tw`w-16 h-16 rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 object-cover shadow-sm`}
`;

const ChannelAvatarPlaceholder = styled.div`
  ${tw`w-16 h-16 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-300 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 flex items-center justify-center text-xl font-bold shadow-sm`}
`;

const ChannelTextDetails = styled.div`
  ${tw`flex flex-col`}
`;

const PrimaryName = styled.h2`
  ${tw`text-lg font-bold text-neutral-900 dark:text-neutral-50 m-0 leading-tight truncate max-w-[170px]`}
`;

const SecondaryName = styled.div`
  ${tw`text-xs text-neutral-500 dark:text-neutral-400 font-medium truncate max-w-[170px] mt-0.5`}
`;

const SubscriberCount = styled.div`
  ${tw`text-[11px] text-neutral-400 dark:text-neutral-500 font-semibold mt-0.5`}
`;

const ChannelLinksRight = styled.div`
  ${tw`flex items-center gap-2`}
`;

const SocialLink = styled(Anchor)<{ $platform: "youtube" | "twitch" | "twitter" }>`
  ${tw`flex items-center justify-center w-9 h-9 rounded-full text-white shadow-sm transition-all hover:scale-105`}
  ${({ $platform }) => $platform === "youtube" && tw`bg-[#FF0000] hover:bg-[#E60000]`}
  ${({ $platform }) => $platform === "twitch" && tw`bg-[#9146FF] hover:bg-[#7C3AED]`}
  ${({ $platform }) => $platform === "twitter" && tw`bg-black dark:bg-neutral-800 hover:(bg-neutral-900 dark:bg-neutral-700)`}
`;

// ─── Icons ─────────────────────────────────────────────────
const BackIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const YouTubeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25a29 29 0 0 0-.46-5.33z" />
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor" />
  </svg>
);

const TwitchIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M21 2H3v16h5v4l4-4h5l4-4V2zm-10 9H9V6h2v5zm4 0h-2V6h2v5z" fill="currentColor" />
  </svg>
);
const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
    <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
  </svg>
);

const formatSubscriberCount = (subscriberCount: string | null | undefined) => {
  if (!subscriberCount) return "";
  const num = parseInt(subscriberCount, 10);
  if (isNaN(num)) return subscriberCount;

  let formattedNum = "";
  if (num >= 1000000) {
    formattedNum = `${(num / 1000000).toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1")}M`;
  } else if (num >= 1000) {
    formattedNum = `${(num / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  } else {
    formattedNum = num.toString();
  }

  return formattedNum;
};

const SpinnerWrapper = styled.div`
  ${tw`flex flex-col items-center justify-center py-12 gap-3 text-neutral-500 text-sm`}
`;

const SpinnerRing = styled.div`
  ${tw`animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500`}
`;

// ─── Component ─────────────────────────────────────────────

interface SelectedMember {
  channel: HolodexChannel;
  twitchLogin: string | null;
}

function ChildComponent() {
  const [followedChannels] = useFollowedChannels({ suspense: true });
  const [channelCache] = useChannelCache({ suspense: true });
  const [favoriteChannels] = useFavoriteChannels({ suspense: true });
  const { t } = useTranslation();

  const [selectedMember, setSelectedMember] = useState<SelectedMember | null>(null);
  const [streams, setStreams] = useState<UnifiedStream[]>([]);
  const [loading, setLoading] = useState(false);

  const defaultTwitchMap = useMemo(
    () => new Map(DEFAULT_VSPO_CHANNELS.map((c) => [c.id, c.twitch])),
    [],
  );

  // Build the list of followed channels with their data
  const followedMembers = useMemo(() => {
    const followedSet = new Set(followedChannels);
    const favoritesSet = new Set(favoriteChannels);
    const members = channelCache.filter((ch) => followedSet.has(ch.id));

    // Map channels by ID for O(1) resolution
    const memberMap = new Map<string, HolodexChannel>(members.map((ch) => [ch.id, ch]));

    // 1. Favorites: Followed channels that are in favoriteChannels, in the exact favoriteChannels order
    const favorites: HolodexChannel[] = [];
    for (const id of favoriteChannels) {
      const ch = memberMap.get(id);
      if (ch) {
        favorites.push(ch);
      }
    }

    // 2. Remaining VSPO and Custom members
    const vspoJp: HolodexChannel[] = [];
    const vspoEn: HolodexChannel[] = [];
    const vspoOfficial: HolodexChannel[] = [];
    const custom: HolodexChannel[] = [];

    for (const ch of members) {
      if (favoritesSet.has(ch.id)) continue;

      const isVspo = ch.org === "VSpo" || ch.group === "VSPO";
      if (isVspo) {
        if (ch.group === "Official" || ch.english_name === "VSPO! Official" || ch.english_name === "VSPO! English") {
          vspoOfficial.push(ch);
        } else if (ch.group === "English") {
          vspoEn.push(ch);
        } else {
          vspoJp.push(ch);
        }
      } else {
        custom.push(ch);
      }
    }

    // Helper for subscriber count sorting
    const sortBySubs = (a: HolodexChannel, b: HolodexChannel) => {
      const aSubs = a.subscriber_count ? Number(a.subscriber_count) : 0;
      const bSubs = b.subscriber_count ? Number(b.subscriber_count) : 0;
      if (aSubs !== bSubs) {
        return bSubs - aSubs;
      }
      const aName = a.english_name || a.name;
      const bName = b.english_name || b.name;
      return aName.localeCompare(bName);
    };

    vspoJp.sort(sortBySubs);
    vspoEn.sort(sortBySubs);
    vspoOfficial.sort(sortBySubs);

    // Sort remaining Custom alphabetically by name
    custom.sort((a, b) => {
      const aName = a.english_name || a.name;
      const bName = b.english_name || b.name;
      return aName.localeCompare(bName);
    });

    return { favorites, vspoJp, vspoEn, vspoOfficial, custom };
  }, [followedChannels, favoriteChannels, channelCache]);

  const handleSelectMember = useCallback(
    async (channel: HolodexChannel) => {
      const twitchLogin = channel.twitch || defaultTwitchMap.get(channel.id) || null;
      setSelectedMember({ channel, twitchLogin });
      setStreams([]);
      setLoading(true);

      try {
        // Fire both fetches in parallel
        const [ytStreams, twitchStreams] = await Promise.all([
          sendRuntimeMessage("getChannelPastStreams", channel.id) as Promise<UnifiedStream[]>,
          twitchLogin
            ? (sendRuntimeMessage("getChannelPastTwitchStreams", twitchLogin) as Promise<UnifiedStream[]>)
            : Promise.resolve([]),
        ]);

        // Merge and sort newest → oldest
        const merged = [...(ytStreams || []), ...(twitchStreams || [])];
        merged.sort((a, b) => {
          const aTime = a.startedAt ? new Date(a.startedAt).getTime() : 0;
          const bTime = b.startedAt ? new Date(b.startedAt).getTime() : 0;
          return bTime - aTime;
        });

        setStreams(merged);
      } catch (error) {
        console.error("[VspoDex] Failed to fetch member streams:", error);
        setStreams([]);
      }

      setLoading(false);
    },
    [defaultTwitchMap],
  );

  const handleBack = useCallback(() => {
    setSelectedMember(null);
    setStreams([]);
  }, []);

  // ── Stream detail view ──
  if (selectedMember) {
    return (
      <>
        <ChannelHeaderContainer>
          <HeaderBar>
            <HeaderBackButton onClick={handleBack}>
              <BackIcon />
              <span>{t("members_back")}</span>
            </HeaderBackButton>
          </HeaderBar>

          <ChannelHeaderMain>
            <ChannelInfoLeft>
              {selectedMember.channel.photo ? (
                <ChannelAvatar src={selectedMember.channel.photo} alt="" />
              ) : (
                <ChannelAvatarPlaceholder>
                  {(selectedMember.channel.english_name || selectedMember.channel.name).charAt(0)}
                </ChannelAvatarPlaceholder>
              )}
              <ChannelTextDetails>
                <PrimaryName>{selectedMember.channel.name}</PrimaryName>
                {selectedMember.channel.english_name && selectedMember.channel.english_name !== selectedMember.channel.name && (
                  <SecondaryName>{selectedMember.channel.english_name}</SecondaryName>
                )}
                {selectedMember.channel.subscriber_count && (
                  <SubscriberCount>
                    {t("member_subscribers").replace("{count}", formatSubscriberCount(selectedMember.channel.subscriber_count))}
                  </SubscriberCount>
                )}
              </ChannelTextDetails>
            </ChannelInfoLeft>

            <ChannelLinksRight>
              <SocialLink $platform="youtube" to={`https://youtube.com/channel/${selectedMember.channel.id}`} title="YouTube">
                <YouTubeIcon />
              </SocialLink>
              {selectedMember.twitchLogin && (
                <SocialLink $platform="twitch" to={`https://twitch.tv/${selectedMember.twitchLogin}`} title="Twitch">
                  <TwitchIcon />
                </SocialLink>
              )}
              {selectedMember.channel.twitter && (
                <SocialLink $platform="twitter" to={`https://x.com/${selectedMember.channel.twitter}`} title="X (Twitter)">
                  <XIcon />
                </SocialLink>
              )}
            </ChannelLinksRight>
          </ChannelHeaderMain>
        </ChannelHeaderContainer>

        {loading ? (
          <SpinnerWrapper>
            <SpinnerRing />
            <span>{t("members_loading")}</span>
          </SpinnerWrapper>
        ) : streams.length === 0 ? (
          <Splash>{t("splash_no_member_streams")}</Splash>
        ) : (
          <StreamList>
            {streams.map((stream) => (
              <StreamCard key={stream.id} stream={stream} />
            ))}
          </StreamList>
        )}
      </>
    );
  }

  // ── Member grid view ──
  const renderFavoriteItem = (channel: HolodexChannel) => {
    const displayName = formatChannelName(channel.name, channel.english_name, channel.group);

    return (
      <FavoriteItem key={channel.id} onClick={() => handleSelectMember(channel)} title={displayName}>
        {channel.photo ? (
          <FavoriteAvatarCircle src={channel.photo} alt="" />
        ) : (
          <FavoriteAvatarPlaceholder>
            {(channel.english_name || channel.name).charAt(0)}
          </FavoriteAvatarPlaceholder>
        )}
      </FavoriteItem>
    );
  };

  const renderMemberItem = (channel: HolodexChannel) => {
    const displayName = formatChannelName(channel.name, channel.english_name, channel.group);

    return (
      <MemberItem key={channel.id} onClick={() => handleSelectMember(channel)} title={displayName}>
        {channel.photo ? (
          <AvatarCircle src={channel.photo} alt="" />
        ) : (
          <AvatarPlaceholder>
            {(channel.english_name || channel.name).charAt(0)}
          </AvatarPlaceholder>
        )}
        <MemberName>{displayName}</MemberName>
      </MemberItem>
    );
  };

  return (
    <>
      <Header>
        <span>{t("header_members")}</span>
      </Header>

      {followedMembers.favorites.length === 0 &&
      followedMembers.vspoJp.length === 0 &&
      followedMembers.vspoEn.length === 0 &&
      followedMembers.vspoOfficial.length === 0 &&
      followedMembers.custom.length === 0 ? (
        <Splash>{t("splash_no_member_streams")}</Splash>
      ) : (
        <MemberGrid>
          {followedMembers.favorites.length > 0 && (
            <>
              <GroupLabel>{t("group_favorites")}</GroupLabel>
              <FavoriteGrid>
                {followedMembers.favorites.map(renderFavoriteItem)}
              </FavoriteGrid>
            </>
          )}
          {followedMembers.vspoJp.length > 0 && (
            <>
              <GroupLabel>{t("group_vspo_jp") || "VSPO JP"}</GroupLabel>
              {followedMembers.vspoJp.map(renderMemberItem)}
            </>
          )}
          {followedMembers.vspoEn.length > 0 && (
            <>
              <GroupLabel>{t("group_vspo_en") || "VSPO EN"}</GroupLabel>
              {followedMembers.vspoEn.map(renderMemberItem)}
            </>
          )}
          {followedMembers.vspoOfficial.length > 0 && (
            <>
              <GroupLabel>{t("group_vspo_official") || "VSPO Official"}</GroupLabel>
              {followedMembers.vspoOfficial.map(renderMemberItem)}
            </>
          )}
          {followedMembers.custom.length > 0 && (
            <>
              <GroupLabel>{t("group_custom_channels")}</GroupLabel>
              {followedMembers.custom.map(renderMemberItem)}
            </>
          )}
        </MemberGrid>
      )}
    </>
  );
}

export function Component() {
  return (
    <Layout>
      <ChildComponent />
    </Layout>
  );
}

export default Component;
