import tw, { styled } from "twin.macro";

import { sendRuntimeMessage } from "~/common/helpers";
import { useRefreshHandler } from "~/browser/contexts";
import { isEmpty } from "~/browser/helpers";
import { useUpcomingStreams } from "~/browser/hooks";

import StreamCard from "~/browser/components/cards/StreamCard";
import Layout from "~/browser/components/Layout";
import Splash from "~/browser/components/Splash";

const StreamList = styled.div``;

const Header = styled.div`
  ${tw`px-4 py-3 text-sm font-medium text-neutral-500 uppercase tracking-wider border-b border-neutral-200 dark:border-neutral-800`}
`;

function ChildComponent() {
  const [upcomingStreams] = useUpcomingStreams({ suspense: true });

  useRefreshHandler(async () => {
    await sendRuntimeMessage("refresh");
  });

  if (isEmpty(upcomingStreams)) {
    return (
      <Splash>
        No upcoming streams scheduled.
        <br />
        Check back later! 📅
      </Splash>
    );
  }

  return (
    <StreamList>
      {upcomingStreams.map((stream) => (
        <StreamCard key={stream.id} stream={stream} />
      ))}
    </StreamList>
  );
}

export function Component() {
  return (
    <Layout>
      <Header>📅 Upcoming</Header>
      <ChildComponent />
    </Layout>
  );
}

export default Component;
