import { useMemo, useState } from "react";
import tw, { styled } from "twin.macro";
import { IconStar, IconStarFilled, IconGripVertical } from "@tabler/icons-react";

import { sendRuntimeMessage, formatChannelName } from "~/common/helpers";
import { HolodexChannel, SuggestionChannel } from "~/common/types";
import { useFollowedChannels, useChannelCache, useHolodexApiKey, useHolodexApiKeyVerified, useSearchChannelsList, useSearchChannelsLastUpdated, useTranslation, useFavoriteChannels, useUnfollowedChannels } from "~/browser/hooks";

const FavoriteButton = styled.button<{ isFavorite: boolean }>`
  ${tw`p-1.5 rounded-lg cursor-pointer transition-colors flex-none ml-2 border-none outline-none`}
  ${(props) =>
    props.isFavorite
      ? tw`bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20`
      : tw`bg-neutral-200 text-neutral-500 hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700`}
`;

const DraggableList = styled.div`
  ${tw`flex flex-col gap-2 mb-6 max-w-md`}
`;

const DraggableRow = styled.div<{ isDragging: boolean }>`
  ${tw`flex items-center gap-3 p-2.5 rounded-lg border bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 transition-all cursor-move`}
  ${(props) => props.isDragging && tw`opacity-50 border-dashed border-indigo-500`}
`;

const GripIcon = styled.div`
  ${tw`text-neutral-400 cursor-grab active:cursor-grabbing flex-none`}
`;

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
  ${tw`flex gap-2 mb-8 items-stretch relative`}
`;

const CustomAddInput = styled.input`
  ${tw`w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-black dark:text-white text-sm outline-none focus:border-indigo-500`}
`;

const CustomInputWrapper = styled.div`
  ${tw`relative flex-1`}
`;

const SuggestionDropdown = styled.div`
  ${tw`absolute top-full left-0 right-0 mt-1 max-h-64 overflow-y-auto bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg z-50`}
`;

const SuggestionItem = styled.div<{ active?: boolean }>`
  ${tw`flex items-center gap-3 p-2.5 cursor-pointer transition-colors`}
  ${(props) =>
    props.active
      ? tw`bg-indigo-500/10 dark:bg-indigo-500/20`
      : tw`hover:(bg-neutral-100 dark:bg-neutral-700/30)`}
`;

const SuggestionAvatar = styled.img`
  ${tw`w-8 h-8 rounded-full flex-none object-cover`}
`;

const SuggestionInfo = styled.div`
  ${tw`flex-1 min-w-0`}
`;

const SuggestionName = styled.div`
  ${tw`text-sm font-medium truncate text-neutral-800 dark:text-neutral-200`}
`;

const SuggestionNativeName = styled.div`
  ${tw`text-xs text-neutral-400 truncate`}
`;

const SuggestionOrg = styled.span`
  ${tw`text-xs bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full font-medium ml-2`}
`;

const SyncStatus = styled.span`
  ${tw`text-xs text-neutral-500 self-center ml-2`}
`;

const RemoveButton = styled.button`
  ${tw`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors flex-none bg-neutral-200 text-neutral-600 hover:bg-red-500 hover:text-white dark:bg-neutral-700 dark:text-neutral-300 dark:hover:bg-red-600 ml-2`}
`;

export function Component() {
  const [followedChannels, followedStore] = useFollowedChannels();
  const [unfollowedChannels, unfollowedStore] = useUnfollowedChannels();
  const [channelCache, channelCacheStore] = useChannelCache();
  const [favoriteChannels, favoriteStore] = useFavoriteChannels();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [holodexApiKey] = useHolodexApiKey();
  const [holodexApiKeyVerified] = useHolodexApiKeyVerified();
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [customChannelId, setCustomChannelId] = useState("");
  const [addingCustom, setAddingCustom] = useState(false);
  const [searchChannelsList] = useSearchChannelsList();
  const [searchChannelsLastUpdated] = useSearchChannelsLastUpdated();
  const [refreshingSearch, setRefreshingSearch] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [showDropdown, setShowDropdown] = useState(false);
  const { t } = useTranslation();

  const followedSet = useMemo(() => new Set(followedChannels), [followedChannels]);
  const favoriteSet = useMemo(() => new Set(favoriteChannels), [favoriteChannels]);
  const cacheMap = useMemo(() => new Map<string, HolodexChannel>(channelCache.map((c) => [c.id, c])), [channelCache]);

  // Helper for subsequence fuzzy matching
  const fuzzyMatch = (target: string, query: string): boolean => {
    let targetIdx = 0;
    let queryIdx = 0;
    while (targetIdx < target.length && queryIdx < query.length) {
      if (target[targetIdx] === query[queryIdx]) {
        queryIdx++;
      }
      targetIdx++;
    }
    return queryIdx === query.length;
  };

  const suggestions = useMemo(() => {
    if (!customChannelId || customChannelId.startsWith("UC")) {
      return [];
    }

    const query = customChannelId.toLowerCase().trim();
    if (!query) return [];

    const matches: { channel: SuggestionChannel; score: number }[] = [];

    for (const ch of searchChannelsList) {
      const eng = (ch.english_name || "").toLowerCase();
      const nat = (ch.name || "").toLowerCase();

      if (eng === query || nat === query) {
        matches.push({ channel: ch, score: 3 });
      } else if (eng.startsWith(query) || nat.startsWith(query)) {
        matches.push({ channel: ch, score: 2 });
      } else if (eng.includes(query) || nat.includes(query)) {
        matches.push({ channel: ch, score: 1.5 });
      } else {
        const queryWords = query.split(/\s+/);
        const matchesAllWords = queryWords.every(word =>
          eng.split(/\s+/).some(w => w.startsWith(word)) ||
          eng.includes(word) ||
          nat.includes(word)
        );
        if (matchesAllWords) {
          matches.push({ channel: ch, score: 1 });
        } else {
          const fuzzyEng = fuzzyMatch(eng, query);
          const fuzzyNat = fuzzyMatch(nat, query);
          if (fuzzyEng || fuzzyNat) {
            matches.push({ channel: ch, score: 0.5 });
          }
        }
      }
    }

    return matches
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        const aName = a.channel.english_name || a.channel.name;
        const bName = b.channel.english_name || b.channel.name;
        return aName.localeCompare(bName);
      })
      .slice(0, 8)
      .map(m => m.channel);
  }, [searchChannelsList, customChannelId]);

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
    if (!holodexApiKey || !holodexApiKeyVerified) {
      alert(t("alert_set_holodex_key"));
      return;
    }

    setRefreshing(true);
    try {
      await sendRuntimeMessage("refreshVspoChannels");
    } catch (error) {
      console.error("Failed to refresh:", error);
      alert(t("alert_refresh_vspo_fail"));
    }
    setRefreshing(false);
  };

  const handleSyncSearchList = async () => {
    if (!holodexApiKey || !holodexApiKeyVerified) {
      alert(t("alert_set_holodex_key"));
      return;
    }

    setRefreshingSearch(true);
    try {
      const count = await sendRuntimeMessage("refreshSearchChannelsList");
      alert(t("alert_sync_search_success").replace("{count}", String(count)));
    } catch (error) {
      console.error("Failed to sync search channels:", error);
      alert(t("alert_sync_search_fail"));
    }
    setRefreshingSearch(false);
  };

  const formattedSyncTime = useMemo(() => {
    if (!searchChannelsLastUpdated) return t("status_never_synced");
    const diffMs = Date.now() - searchChannelsLastUpdated;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return t("status_just_now");
    if (diffMins < 60) return `${diffMins}${t("status_mins_ago")}`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}${t("status_hours_ago")}`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}${t("status_days_ago")}`;
  }, [searchChannelsLastUpdated, t]);

  const handleSelectSuggestion = async (suggestion: SuggestionChannel) => {
    try {
      const cacheMap = new Map<string, HolodexChannel>(channelCache.map((c) => [c.id, c]));

      if (!cacheMap.has(suggestion.id)) {
        cacheMap.set(suggestion.id, {
          id: suggestion.id,
          name: suggestion.name,
          english_name: suggestion.english_name || "",
          type: "vtuber",
          photo: suggestion.photo || "",
          org: suggestion.org || "",
        });
        await channelCacheStore.set(Array.from(cacheMap.values()));
      }

      if (!followedSet.has(suggestion.id)) {
        await followedStore.set([...followedChannels, suggestion.id]);
        await unfollowedStore.set(unfollowedChannels.filter((id) => id !== suggestion.id));
      }
    } catch (error) {
      console.error("Failed to select suggestion:", error);
    }

    setCustomChannelId("");
    setShowDropdown(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex(prev => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter") {
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        e.preventDefault();
        handleSelectSuggestion(suggestions[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  const handleAddCustomChannel = async () => {
    if (!holodexApiKey || !holodexApiKeyVerified) {
      alert(t("alert_set_holodex_key"));
      return;
    }

    const sanitizedId = customChannelId.replace(/[\s/]/g, "");
    if (!sanitizedId) return;

    setAddingCustom(true);
    try {
      const success = await sendRuntimeMessage("addCustomChannel", sanitizedId);
      if (success) {
        alert(t("alert_add_custom_success"));
        setCustomChannelId("");
      } else {
        alert(t("alert_add_custom_fail"));
      }
    } catch (error) {
      console.error("Failed to add custom channel:", error);
      alert(t("alert_add_custom_comm_error"));
    }
    setAddingCustom(false);
  };

  const handleToggleFollow = async (channelId: string) => {
    if (followedSet.has(channelId)) {
      await followedStore.set(followedChannels.filter((id) => id !== channelId));
      await favoriteStore.set(favoriteChannels.filter((id) => id !== channelId));
      await unfollowedStore.set(Array.from(new Set([...unfollowedChannels, channelId])));
    } else {
      await followedStore.set([...followedChannels, channelId]);
      await unfollowedStore.set(unfollowedChannels.filter((id) => id !== channelId));
    }
  };

  const handleRemoveChannel = async (channelId: string) => {
    if (followedSet.has(channelId)) {
      await followedStore.set(followedChannels.filter((id) => id !== channelId));
      await unfollowedStore.set(Array.from(new Set([...unfollowedChannels, channelId])));
    }
    await favoriteStore.set(favoriteChannels.filter((id) => id !== channelId));
    await channelCacheStore.set(channelCache.filter((ch) => ch.id !== channelId));
  };

  const handleToggleFavorite = async (channelId: string) => {
    if (favoriteSet.has(channelId)) {
      await favoriteStore.set(favoriteChannels.filter((id) => id !== channelId));
    } else {
      await favoriteStore.set([...favoriteChannels, channelId]);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newList = [...favoriteChannels];
    const draggedItem = newList[draggedIndex];
    newList.splice(draggedIndex, 1);
    newList.splice(index, 0, draggedItem);
    setDraggedIndex(index);
    favoriteStore.set(newList);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const groupedChannels = useMemo(() => {
    const groups: Record<string, HolodexChannel[]> = {};
    for (const channel of displayChannels) {
      const isVspo = channel.org?.toLowerCase() === "vspo" || channel.group?.toLowerCase() === "vspo";
      const groupName = isVspo ? (channel.group || "VSPO") : "Custom channels";

      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(channel);
    }

    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (a === "Custom channels") return -1;
      if (b === "Custom channels") return 1;

      const aEng = /\b(en|english)\b/i.test(a);
      const bEng = /\b(en|english)\b/i.test(b);
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
    const idsSet = new Set(ids);
    await unfollowedStore.set(unfollowedChannels.filter(id => !idsSet.has(id)));
  };

  const handleUnfollowGroup = async (channelsToUnfollow: HolodexChannel[]) => {
    const idsToUnfollow = new Set(channelsToUnfollow.map(c => c.id));
    const newFollowed = followedChannels.filter(id => !idsToUnfollow.has(id));
    await followedStore.set(newFollowed);
    const newFavorites = favoriteChannels.filter(id => !idsToUnfollow.has(id));
    await favoriteStore.set(newFavorites);
    await unfollowedStore.set(Array.from(new Set([...unfollowedChannels, ...Array.from(idsToUnfollow)])));
  };

  return (
    <>
      <Section>
        <SectionTitle>
          {t("section_vtuber_channels")}
          <CountBadge>{followedChannels.length} {t("followed_badge")}</CountBadge>
        </SectionTitle>
        <SectionDescription>
          {t("desc_vtuber_channels")}
        </SectionDescription>

        <ButtonGroup>
          <Button onClick={handleRefreshVspo} disabled={refreshing}>
            {refreshing ? t("btn_refreshing") : t("btn_refresh_vspo")}
          </Button>
          <Button variant="outline" onClick={handleSyncSearchList} disabled={refreshingSearch}>
            {refreshingSearch ? t("btn_syncing") : t("btn_sync_search")}
          </Button>
          <SyncStatus>{t("status_last_synced")} {formattedSyncTime}</SyncStatus>
        </ButtonGroup>

        <GroupTitle>{t("setting_favorite_order")}</GroupTitle>
        <SectionDescription>
          {t("desc_favorite_order")}
        </SectionDescription>

        {favoriteChannels.length === 0 ? (
          <EmptyState style={{ padding: "1.5rem 0" }}>{t("empty_no_favorites")}</EmptyState>
        ) : (
          <DraggableList>
            {favoriteChannels.map((channelId, index) => {
              const channel = cacheMap.get(channelId);
              if (!channel) return null;
              const displayName = formatChannelName(channel.name, channel.english_name, channel.group);

              return (
                <DraggableRow
                  key={channel.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  isDragging={draggedIndex === index}
                >
                  <GripIcon>
                    <IconGripVertical size="1.25rem" />
                  </GripIcon>
                  {channel.photo ? (
                    <ChannelAvatar src={channel.photo} alt="" style={{ width: "2rem", height: "2rem" }} />
                  ) : (
                    <AvatarPlaceholder style={{ width: "2rem", height: "2rem", fontSize: "0.875rem" }}>
                      {(channel.english_name || channel.name).charAt(0)}
                    </AvatarPlaceholder>
                  )}
                  <ChannelInfo>
                    <ChannelName style={{ fontSize: "0.875rem" }}>{displayName}</ChannelName>
                  </ChannelInfo>
                  <FavoriteButton
                    isFavorite={true}
                    onClick={() => handleToggleFavorite(channel.id)}
                  >
                    <IconStarFilled size="1.25rem" />
                  </FavoriteButton>
                </DraggableRow>
              );
            })}
          </DraggableList>
        )}

        <GroupTitle>{t("section_add_custom")}</GroupTitle>
        <SectionDescription>
          {t("desc_add_custom")}
        </SectionDescription>
        <CustomAddContainer>
          <CustomInputWrapper>
            <CustomAddInput
              type="text"
              value={customChannelId}
              onChange={(e) => {
                setCustomChannelId(e.target.value);
                setShowDropdown(true);
                setHighlightedIndex(-1);
              }}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => {
                setTimeout(() => setShowDropdown(false), 200);
              }}
              onKeyDown={handleKeyDown}
              placeholder={t("placeholder_add_custom")}
            />
            {showDropdown && suggestions.length > 0 && (
              <SuggestionDropdown>
                {suggestions.map((ch, index) => (
                  <SuggestionItem
                    key={ch.id}
                    active={index === highlightedIndex}
                    onClick={() => handleSelectSuggestion(ch)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    {ch.photo ? (
                      <SuggestionAvatar src={ch.photo} alt="" />
                    ) : (
                      <AvatarPlaceholder style={{ width: '2rem', height: '2rem', fontSize: '0.875rem' }}>
                        {(ch.english_name || ch.name).charAt(0)}
                      </AvatarPlaceholder>
                    )}
                    <SuggestionInfo>
                      <SuggestionName>{ch.english_name || ch.name}</SuggestionName>
                      {ch.english_name && ch.name !== ch.english_name && (
                        <SuggestionNativeName>{ch.name}</SuggestionNativeName>
                      )}
                    </SuggestionInfo>
                    {ch.org && <SuggestionOrg>{ch.org}</SuggestionOrg>}
                  </SuggestionItem>
                ))}
              </SuggestionDropdown>
            )}
          </CustomInputWrapper>
          <Button onClick={handleAddCustomChannel} disabled={addingCustom || !customChannelId}>
            {addingCustom ? t("btn_adding") : t("btn_add_channel")}
          </Button>
        </CustomAddContainer>

        <SearchInput
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t("placeholder_search_channels")}
        />

        {displayChannels.length === 0 ? (
          <EmptyState>
            {channelCache.length === 0
              ? t("empty_no_channels_loaded")
              : t("empty_no_channels_match")}
          </EmptyState>
        ) : (
          <div>
            {groupedChannels.map((group) => (
              <div key={group.name}>
                <GroupTitle>
                  {group.name === "Custom channels" ? t("group_custom_channels") : group.name}
                  <GroupActionButtons>
                    <SmallButton variant="outline" onClick={() => handleFollowGroup(group.channels)}>{t("btn_follow_all")}</SmallButton>
                    <SmallButton variant="danger" onClick={() => handleUnfollowGroup(group.channels)}>{t("btn_unfollow_all")}</SmallButton>
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
                      {followedSet.has(channel.id) && (
                        <FavoriteButton
                          isFavorite={favoriteSet.has(channel.id)}
                          onClick={() => handleToggleFavorite(channel.id)}
                          title="Favorite"
                        >
                          {favoriteSet.has(channel.id) ? (
                            <IconStarFilled size="1.25rem" />
                          ) : (
                            <IconStar size="1.25rem" />
                          )}
                        </FavoriteButton>
                      )}
                      <FollowButton
                        isFollowed={followedSet.has(channel.id)}
                        onClick={() => handleToggleFollow(channel.id)}
                      >
                        {followedSet.has(channel.id) ? t("btn_unfollow") : t("btn_follow")}
                      </FollowButton>
                      {group.name === "Custom channels" && (
                        <RemoveButton onClick={() => handleRemoveChannel(channel.id)}>
                          {t("btn_remove")}
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
