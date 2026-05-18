import { useMemo } from "react";
import tw, { styled } from "twin.macro";

import { sendRuntimeMessage } from "~/common/helpers";
import { useRefreshHandler } from "~/browser/contexts";
import { isEmpty } from "~/browser/helpers";
import { useLiveStreams, useHolodexApiKey, useTwitchAccessToken } from "~/browser/hooks";

import StreamCard from "~/browser/components/cards/StreamCard";
import Layout from "~/browser/components/Layout";
import Splash from "~/browser/components/Splash";

const StreamList = styled.div``;

const Header = styled.div`
  ${tw`px-4 py-3 text-sm font-medium text-neutral-500 uppercase tracking-wider border-b border-neutral-200 dark:border-neutral-800`}
`;

const ActionButton = styled.button`
  ${tw`px-6 py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold rounded-lg shadow-md transition-colors cursor-pointer border-none outline-none`}
`;

function ChildComponent() {
  const [liveStreams] = useLiveStreams({ suspense: true });
  const [holodexApiKey] = useHolodexApiKey();
  const [twitchAccessToken] = useTwitchAccessToken();

  useRefreshHandler(async () => {
    await sendRuntimeMessage("refresh");
  });

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

  const isNotSetup = !holodexApiKey && !twitchAccessToken;

  if (isNotSetup) {
    return (
      <Splash>
        <div css={tw`flex flex-col items-center max-w-xs mx-auto`}>
          <div css={tw`text-neutral-700 dark:text-neutral-300 font-semibold mb-2 text-base`}>
            VspoDex Needs Setup
          </div>
          <div css={tw`text-xs text-neutral-400 dark:text-neutral-500 mb-5 leading-relaxed`}>
            Please configure a Holodex API key or connect your Twitch account to start tracking live streams.
          </div>
          <ActionButton onClick={handleOpenSettings}>
            ⚙️ Set up API Keys
          </ActionButton>
        </div>
      </Splash>
    );
  }

  if (isEmpty(liveStreams)) {
    return (
      <Splash>
        No live streams right now.
        <br />
        Check back later! 📺
      </Splash>
    );
  }

  return (
    <StreamList>
      {liveStreams.map((stream) => (
        <StreamCard key={stream.id} stream={stream} />
      ))}
    </StreamList>
  );
}

export function Component() {
  return (
    <Layout>
      <Header>🔴 Live Now</Header>
      <ChildComponent />
    </Layout>
  );
}

export default Component;
