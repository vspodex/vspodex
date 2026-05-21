import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import tw, { styled } from "twin.macro";

import { sendRuntimeMessage } from "~/common/helpers";
import { isEmpty } from "~/browser/helpers";
import {
  usePastStreams,
  usePastTwitchStreams,
  useFollowedChannels,
  useSettings,
  useTranslation,
} from "~/browser/hooks";

import StreamCard from "~/browser/components/cards/StreamCard";
import Layout from "~/browser/components/Layout";
import Splash from "~/browser/components/Splash";

const StreamList = styled.div``;

const Header = styled.div`
  ${tw`px-4 py-3 text-sm font-medium text-neutral-500 uppercase tracking-wider border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between`}
`;

const RefreshButton = styled.button<{ spinning: boolean }>`
  ${tw`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:(text-indigo-700 dark:text-indigo-300 bg-indigo-500/10 dark:bg-indigo-500/20) cursor-pointer transition-colors bg-transparent border-none outline-none`}

  svg {
    transition: transform 0.4s ease;
    ${(props) => props.spinning && tw`animate-spin`}
  }
`;

const LoadingMore = styled.div`
  ${tw`flex items-center justify-center py-4 text-sm text-neutral-500`}
`;

const Sentinel = styled.div`
  ${tw`h-1`}
`;

const SubTabContainer = styled.div`
  ${tw`flex border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50`}
`;

const SubTabButton = styled.button<{ active: boolean; isYoutube?: boolean }>`
  ${tw`flex-1 py-2 text-center text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer bg-transparent border-transparent`}
  ${(props) =>
    props.active
      ? props.isYoutube
        ? tw`text-red-600 dark:text-red-500 border-red-600 dark:border-red-500`
        : tw`text-indigo-600 dark:text-indigo-400 border-indigo-600 dark:border-indigo-400`
      : tw`text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 border-transparent`}
`;

function ChildComponent() {
  const [pastStreams] = usePastStreams({ suspense: true });
  const [pastTwitchStreams] = usePastTwitchStreams({ suspense: true });
  const [followedChannels] = useFollowedChannels({ suspense: true });
  const [settings] = useSettings({ suspense: true });
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  const [activeSubTab, setActiveSubTab] = useState<"youtube" | "twitch">("youtube");

  const enableTwitch = settings.general.enableExperimentalTwitchPast !== false;

  // Filter past streams by followed channels (unless showCollabStreams is enabled)
  const filteredStreams = useMemo(() => {
    if (settings.general.showCollabStreams) return pastStreams;
    const followedSet = new Set(followedChannels);
    return pastStreams.filter((s) => followedSet.has(s.channelId));
  }, [pastStreams, followedChannels, settings.general.showCollabStreams]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await sendRuntimeMessage("refreshPastStreams");
    } catch (error) {
      console.error("Past streams refresh failed:", error);
    }
    setTimeout(() => setRefreshing(false), 600);
  };

  const handleLoadMore = useCallback(async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      await sendRuntimeMessage("loadMorePastStreams");
    } catch (error) {
      console.error("Load more past streams failed:", error);
    }
    setTimeout(() => setLoadingMore(false), 300);
  }, [loadingMore]);

  // Infinite scroll observer - ONLY active when Twitch experimental is disabled, or we are on YouTube sub-tab
  useEffect(() => {
    if (!enableTwitch || activeSubTab === "youtube") {
      const sentinel = sentinelRef.current;
      if (!sentinel) return;

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && filteredStreams.length > 0) {
            handleLoadMore();
          }
        },
        { threshold: 0.1 }
      );

      observer.observe(sentinel);
      return () => observer.disconnect();
    }
  }, [enableTwitch, activeSubTab, handleLoadMore, filteredStreams.length]);

  return (
    <>
      <Header>
        <span>{t("header_past_streams")}</span>
        {(!enableTwitch || activeSubTab === "youtube") && (
          <RefreshButton onClick={handleRefresh} spinning={refreshing}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
            </svg>
            {refreshing ? t("btn_refreshing_past") : t("btn_refresh_past")}
          </RefreshButton>
        )}
      </Header>

      {enableTwitch && (
        <SubTabContainer>
          <SubTabButton
            active={activeSubTab === "youtube"}
            isYoutube={true}
            onClick={() => setActiveSubTab("youtube")}
          >
            {t("tab_youtube") || "YouTube"}
          </SubTabButton>
          <SubTabButton
            active={activeSubTab === "twitch"}
            onClick={() => setActiveSubTab("twitch")}
          >
            {t("tab_twitch") || "Twitch"}
          </SubTabButton>
        </SubTabContainer>
      )}

      {(!enableTwitch || activeSubTab === "youtube") ? (
        isEmpty(filteredStreams) ? (
          <Splash>{t("splash_no_past")}</Splash>
        ) : (
          <>
            <StreamList>
              {filteredStreams.map((stream) => (
                <StreamCard key={stream.id} stream={stream} />
              ))}
            </StreamList>
            {loadingMore && (
              <LoadingMore>{t("past_streams_loading_more")}</LoadingMore>
            )}
            <Sentinel ref={sentinelRef} />
          </>
        )
      ) : (
        isEmpty(pastTwitchStreams) ? (
          <Splash>{t("splash_no_past_twitch") || "No past Twitch broadcasts found."}</Splash>
        ) : (
          <StreamList>
            {pastTwitchStreams.map((stream) => (
              <StreamCard key={stream.id} stream={stream} />
            ))}
          </StreamList>
        )
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

