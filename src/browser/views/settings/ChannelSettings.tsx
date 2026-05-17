import { useMemo, useState } from "react";
import tw, { styled } from "twin.macro";

import { sendRuntimeMessage, formatChannelName } from "~/common/helpers";
import { HolodexChannel } from "~/common/types";
import { useFollowedChannels, useChannelCache, useHolodexApiKey } from "~/browser/hooks";

const Section = styled.div`
  ${tw`mb-8`}
`;

const SectionTitle = styled.h2`
  ${tw`text-lg font-semibold mb-4`}
`;

const GroupTitle = styled.h3`
  ${tw`text-base font-semibold mt-6 mb-3 flex items-center justify-between`}
`;

const GroupActionButtons = styled.div`
  ${tw`flex gap-2`}
`;

const SectionDescription = styled.p`
  ${tw`text-sm text-neutral-500 mb-4`}
`;

const Button = styled.button<{ variant?: "primary" | "danger" | "outline" }>`
  ${tw`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors`}
  ${(props) => {
    switch (props.variant) {
      case "danger":
        return tw`bg-red-600 hover:bg-red-700 text-white`;
      case "outline":
        return tw`border border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 hover:(bg-neutral-200 dark:bg-neutral-700)`;
      default:
        return tw`bg-indigo-600 hover:bg-indigo-700 text-white`;
    }
  }}
`;

const SmallButton = styled(Button)`
  ${tw`px-2 py-1 text-xs`}
`;

const ButtonGroup = styled.div`
  ${tw`flex gap-2 mb-4`}
`;

const ChannelGrid = styled.div`
  ${tw`grid grid-cols-1 gap-2`}
`;

const ChannelRow = styled.div<{ isFollowed: boolean }>`
  ${tw`flex items-center gap-3 p-3 rounded-lg transition-colors`}
  ${(props) =>
    props.isFollowed
      ? tw`bg-indigo-500/10 border border-indigo-500/30`
      : tw`bg-neutral-100 dark:bg-neutral-800 border border-transparent`}
`;

const ChannelAvatar = styled.img`
  ${tw`w-10 h-10 rounded-full flex-none`}
`;

const AvatarPlaceholder = styled.div`
  ${tw`w-10 h-10 rounded-full flex-none bg-neutral-300 dark:bg-neutral-600 flex items-center justify-center text-sm font-medium`}
`;

const ChannelInfo = styled.div`
  ${tw`flex-1 overflow-hidden`}
`;

const ChannelName = styled.div`
  ${tw`font-medium truncate`}
`;

const FollowButton = styled.button<{ isFollowed: boolean }>`
  ${tw`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors flex-none`}
  ${(props) =>
    props.isFollowed
      ? tw`bg-red-500/10 text-red-400 hover:bg-red-500/20`
      : tw`bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20`}
`;

const SearchInput = styled.input`
  ${tw`w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-black dark:text-white text-sm outline-none focus:border-indigo-500 mb-4`}
`;

const CountBadge = styled.span`
  ${tw`text-xs bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full ml-2`}
`;

const EmptyState = styled.div`
  ${tw`text-center text-neutral-500 py-8 text-sm`}
`;

const CustomAddContainer = styled.div`
  ${tw`flex gap-2 mb-8 items-stretch`}
`;

const CustomAddInput = styled.input`
  ${tw`flex-1 px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-black dark:text-white text-sm outline-none focus:border-indigo-500`}
`;

const RemoveButton = styled.button`
  ${tw`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors flex-none bg-neutral-200 text-neutral-600 hover:bg-red-500 hover:text-white dark:bg-neutral-700 dark:text-neutral-300 dark:hover:bg-red-600 ml-2`}
`;

export function Component() {
  const [followedChannels, followedStore] = useFollowedChannels();
  const [channelCache, channelCacheStore] = useChannelCache();
  const [holodexApiKey] = useHolodexApiKey();
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [customChannelId, setCustomChannelId] = useState("");
  const [addingCustom, setAddingCustom] = useState(false);

  const followedSet = useMemo(() => new Set(followedChannels), [followedChannels]);

  const displayChannels = useMemo(() => {
    let channels = channelCache;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      channels = channels.filter(
        (ch) =>
          ch.name.toLowerCase().includes(query) ||
          (ch.english_name && ch.english_name.toLowerCase().includes(query)),
      );
    }

    // Sort: followed first, then by name
    return [...channels].sort((a, b) => {
      const aFollowed = followedSet.has(a.id);
      const bFollowed = followedSet.has(b.id);

      if (aFollowed !== bFollowed) {
        return aFollowed ? -1 : 1;
      }

      const aName = a.english_name || a.name;
      const bName = b.english_name || b.name;
      return aName.localeCompare(bName);
    });
  }, [channelCache, searchQuery, followedSet]);

  const handleRefreshVspo = async () => {
    if (!holodexApiKey) {
      alert("Please set your Holodex API key first!");
      return;
    }

    setRefreshing(true);
    try {
      await sendRuntimeMessage("refreshVspoChannels");
    } catch (error) {
      console.error("Failed to refresh:", error);
      alert("Failed to refresh VSPO channels. Check your API key.");
    }
    setRefreshing(false);
  };

  const handleAddCustomChannel = async () => {
    const sanitizedId = customChannelId.replace(/[\s/]/g, "");
    if (!sanitizedId) return;

    setAddingCustom(true);
    try {
      const success = await sendRuntimeMessage("addCustomChannel", sanitizedId);
      if (success) {
        alert("Channel added successfully!");
        setCustomChannelId("");
      } else {
        alert("Error: Channel not found on Holodex. Please check the ID.");
      }
    } catch (error) {
      console.error("Failed to add custom channel:", error);
      alert("Error: Failed to communicate with background script.");
    }
    setAddingCustom(false);
  };

  const handleToggleFollow = async (channelId: string) => {
    if (followedSet.has(channelId)) {
      await followedStore.set(followedChannels.filter((id) => id !== channelId));
    } else {
      await followedStore.set([...followedChannels, channelId]);
    }
  };

  const handleRemoveChannel = async (channelId: string) => {
    if (followedSet.has(channelId)) {
      await followedStore.set(followedChannels.filter((id) => id !== channelId));
    }
    await channelCacheStore.set(channelCache.filter((ch) => ch.id !== channelId));
  };

  const groupedChannels = useMemo(() => {
    const groups: Record<string, HolodexChannel[]> = {};
    for (const channel of displayChannels) {
      const isVspo = channel.org === "VSpo" || channel.group === "VSPO";
      const groupName = isVspo ? (channel.group || "VSPO") : "Custom channels";

      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(channel);
    }
    
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (a === "Custom channels") return -1;
      if (b === "Custom channels") return 1;

      const aEng = a.toLowerCase().includes("english") || a.toLowerCase().includes("en");
      const bEng = b.toLowerCase().includes("english") || b.toLowerCase().includes("en");
      if (aEng && !bEng) return 1;
      if (!aEng && bEng) return -1;
      return a.localeCompare(b);
    });

    return sortedKeys.map(key => ({
      name: key,
      channels: groups[key]
    }));
  }, [displayChannels]);

  const handleFollowGroup = async (channelsToFollow: HolodexChannel[]) => {
    const ids = channelsToFollow.map(c => c.id);
    const merged = new Set([...followedChannels, ...ids]);
    await followedStore.set(Array.from(merged));
  };

  const handleUnfollowGroup = async (channelsToUnfollow: HolodexChannel[]) => {
    const idsToUnfollow = new Set(channelsToUnfollow.map(c => c.id));
    const newFollowed = followedChannels.filter(id => !idsToUnfollow.has(id));
    await followedStore.set(newFollowed);
  };

  return (
    <>
      <Section>
        <SectionTitle>
          VTuber Channels
          <CountBadge>{followedChannels.length} followed</CountBadge>
        </SectionTitle>
        <SectionDescription>
          Manage which VTuber channels you follow. Click "Refresh VSPO Members" to
          update the list from Holodex.
        </SectionDescription>

        <ButtonGroup>
          <Button onClick={handleRefreshVspo} disabled={refreshing}>
            {refreshing ? "Refreshing..." : "🔄 Refresh VSPO Members"}
          </Button>
        </ButtonGroup>

        <GroupTitle>Add Custom Channel</GroupTitle>
        <SectionDescription>
          Paste a YouTube Channel ID to track any VTuber (Indie, Hololive, Nijisanji, etc.)
        </SectionDescription>
        <CustomAddContainer>
          <CustomAddInput
            type="text"
            value={customChannelId}
            onChange={(e) => setCustomChannelId(e.target.value)}
            placeholder="e.g. UCXU7YYxy_iQd3ulXyO-zC-Q"
          />
          <Button onClick={handleAddCustomChannel} disabled={addingCustom || !customChannelId}>
            {addingCustom ? "Adding..." : "Add Channel"}
          </Button>
        </CustomAddContainer>

        <SearchInput
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search channels..."
        />

        {displayChannels.length === 0 ? (
          <EmptyState>
            {channelCache.length === 0
              ? 'No channels loaded yet. Click "Refresh VSPO Members" to fetch the channel list.'
              : "No channels match your search."}
          </EmptyState>
        ) : (
          <div>
            {groupedChannels.map((group) => (
              <div key={group.name}>
                <GroupTitle>
                  {group.name}
                  <GroupActionButtons>
                    <SmallButton variant="outline" onClick={() => handleFollowGroup(group.channels)}>Follow All</SmallButton>
                    <SmallButton variant="danger" onClick={() => handleUnfollowGroup(group.channels)}>Unfollow All</SmallButton>
                  </GroupActionButtons>
                </GroupTitle>
                <ChannelGrid>
                  {group.channels.map((channel) => (
                    <ChannelRow
                      key={channel.id}
                      isFollowed={followedSet.has(channel.id)}
                    >
                      {channel.photo ? (
                        <ChannelAvatar src={channel.photo} alt="" />
                      ) : (
                        <AvatarPlaceholder>
                          {(channel.english_name || channel.name).charAt(0)}
                        </AvatarPlaceholder>
                      )}
                      <ChannelInfo>
                        <ChannelName>
                          {formatChannelName(channel.name, channel.english_name, channel.group)}
                        </ChannelName>
                      </ChannelInfo>
                      <FollowButton
                        isFollowed={followedSet.has(channel.id)}
                        onClick={() => handleToggleFollow(channel.id)}
                      >
                        {followedSet.has(channel.id) ? "Unfollow" : "Follow"}
                      </FollowButton>
                      {group.name === "Custom channels" && (
                        <RemoveButton onClick={() => handleRemoveChannel(channel.id)}>
                          Remove
                        </RemoveButton>
                      )}
                    </ChannelRow>
                  ))}
                </ChannelGrid>
              </div>
            ))}
          </div>
        )}
      </Section>
    </>
  );
}

export default Component;
