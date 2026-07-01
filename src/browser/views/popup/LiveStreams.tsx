import { useMemo, useState } from "react";
import tw, { styled } from "twin.macro";

import { sendRuntimeMessage } from "~/common/helpers";
import { useRefreshHandler } from "~/browser/contexts";
import { isEmpty } from "~/browser/helpers";
import { useLiveStreams, useHolodexApiKey, useHolodexApiKeyVerified, useTwitchAccessToken, useTranslation } from "~/browser/hooks";

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

const ActionButton = styled.button`
  ${tw`px-6 py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold rounded-lg shadow-md transition-colors cursor-pointer border-none outline-none`}
`;

function ChildComponent() {
  const [liveStreams] = useLiveStreams({ suspense: true });
  const [holodexApiKey] = useHolodexApiKey();
  const [holodexApiKeyVerified] = useHolodexApiKeyVerified();
  const [twitchAccessToken] = useTwitchAccessToken();
  const [refreshing, setRefreshing] = useState(false);
  const { t } = useTranslation();

  useRefreshHandler(async () => {
    await sendRuntimeMessage("refresh");
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await sendRuntimeMessage("refresh");
    } catch (error) {
      console.error("Live streams refresh failed:", error);
    }
    setTimeout(() => setRefreshing(false), 600);
  };

  const handleOpenSettings = async () => {
    const targetUrl = browser.runtime.getURL("settings.html#/api-keys");
    try {
      const tabs = await browser.tabs.query({ url: browser.runtime.getURL("settings.html*") });
      if (tabs.length > 0) {
        await browser.tabs.update(tabs[0].id!, { url: targetUrl, active: true });
        if (tabs[0].windowId) {
          await browser.windows.update(tabs[0].windowId, { focused: true });
        }
      } else {
        await browser.tabs.create({ url: targetUrl });
      }
    } catch {
      await browser.tabs.create({ url: targetUrl });
    }
  };

  const isNotSetup = (!holodexApiKey || !holodexApiKeyVerified) && !twitchAccessToken;

  if (isNotSetup) {
    return (
      <>
        <Header>
          <span>{t("header_live_now")}</span>
        </Header>
        <Splash>
          <div css={tw`flex flex-col items-center max-w-xs mx-auto`}>
            <div css={tw`text-neutral-700 dark:text-neutral-300 font-semibold mb-2 text-base`}>
              {t("splash_needs_setup_title")}
            </div>
            <div css={tw`text-xs text-neutral-400 dark:text-neutral-500 mb-5 leading-relaxed`}>
              {t("splash_needs_setup_desc")}
            </div>
            <ActionButton onClick={handleOpenSettings}>
              {t("btn_setup_api_keys")}
            </ActionButton>
          </div>
        </Splash>
      </>
    );
  }

  if (isEmpty(liveStreams)) {
    return (
      <>
        <Header>
          <span>{t("header_live_now")}</span>
          <RefreshButton onClick={handleRefresh} spinning={refreshing}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
            </svg>
            {refreshing ? t("btn_refreshing_popup") : t("btn_refresh")}
          </RefreshButton>
        </Header>
        <Splash>
          {t("splash_no_live")}
        </Splash>
      </>
    );
  }

  return (
    <>
      <Header>
        <span>{t("header_live_now")}</span>
        <RefreshButton onClick={handleRefresh} spinning={refreshing}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
          </svg>
          {refreshing ? t("btn_refreshing_popup") : t("btn_refresh")}
        </RefreshButton>
      </Header>
      <StreamList>
        {liveStreams.map((stream) => (
          <StreamCard key={stream.id} stream={stream} />
        ))}
      </StreamList>
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
