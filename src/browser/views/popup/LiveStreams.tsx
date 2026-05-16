import { useMemo } from "react";
import tw, { styled } from "twin.macro";

import { sendRuntimeMessage } from "~/common/helpers";
import { useRefreshHandler } from "~/browser/contexts";
import { isEmpty } from "~/browser/helpers";
import { useLiveStreams } from "~/browser/hooks";

import StreamCard from "~/browser/components/cards/StreamCard";
import Layout from "~/browser/components/Layout";
import Splash from "~/browser/components/Splash";

const StreamList = styled.div``;

const Header = styled.div`
  ${tw`px-4 py-3 text-sm font-medium text-neutral-500 uppercase tracking-wider border-b border-neutral-200 dark:border-neutral-800`}
`;

function ChildComponent() {
  const [liveStreams] = useLiveStreams({ suspense: true });

  useRefreshHandler(async () => {
    await sendRuntimeMessage("refresh");
  });

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
