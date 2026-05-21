import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import tw, { styled } from "twin.macro";

import { sendRuntimeMessage } from "~/common/helpers";
import { isEmpty } from "~/browser/helpers";
import { usePastStreams, useFollowedChannels, useSettings, useTranslation } from "~/browser/hooks";

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

function ChildComponent() {
  const [pastStreams] = usePastStreams({ suspense: true });
  const [followedChannels] = useFollowedChannels({ suspense: true });
  const [settings] = useSettings({ suspense: true });
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

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

  useEffect(() => {
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
  }, [handleLoadMore, filteredStreams.length]);

  if (isEmpty(filteredStreams)) {
    return (
      <>
        <Header>
          <span>{t("header_past_streams")}</span>
          <RefreshButton onClick={handleRefresh} spinning={refreshing}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
            </svg>
            {refreshing ? t("btn_refreshing_past") : t("btn_refresh_past")}
          </RefreshButton>
        </Header>
        <Splash>
          {t("splash_no_past")}
        </Splash>
      </>
    );
  }

  return (
    <>
      <Header>
        <span>{t("header_past_streams")}</span>
        <RefreshButton onClick={handleRefresh} spinning={refreshing}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
          </svg>
          {refreshing ? t("btn_refreshing_past") : t("btn_refresh_past")}
        </RefreshButton>
      </Header>
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
