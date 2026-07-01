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
    const displayName = formatChannelName(
      selectedMember.channel.name,
      selectedMember.channel.english_name,
      selectedMember.channel.group,
    );

    return (
      <>
        <Header>
          <span>{t("header_member_streams").replace("{name}", displayName)}</span>
          <BackButton onClick={handleBack}>{t("members_back")}</BackButton>
        </Header>

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
              {followedMembers.favorites.map(renderMemberItem)}
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
