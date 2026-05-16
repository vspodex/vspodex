import { useState } from "react";
import { css, Global } from "@emotion/react";
import { Outlet } from "react-router";
import tw, { styled } from "twin.macro";

import { sendRuntimeMessage } from "~/common/helpers";
import { SearchProvider } from "~/browser/contexts";

import Loader from "~/browser/components/Loader";
import Sidebar from "~/browser/components/Sidebar";

const Wrapper = styled.div`
  ${tw`flex h-full relative`}
`;

const Body = styled.div`
  ${tw`flex-1 overflow-hidden flex flex-col`}
`;

const TopBar = styled.div`
  ${tw`flex items-center justify-end px-3 py-1.5 border-b border-neutral-200 dark:border-neutral-800 flex-none`}
`;

const RefreshButton = styled.button<{ spinning: boolean }>`
  ${tw`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium text-neutral-500 hover:(text-indigo-400 bg-neutral-200 dark:bg-neutral-700) cursor-pointer transition-colors`}

  svg {
    transition: transform 0.4s ease;
    ${(props) => props.spinning && tw`animate-spin`}
  }
`;

const ContentArea = styled.div`
  ${tw`flex-1 overflow-y-auto`}
`;

export function Component() {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await sendRuntimeMessage("refresh");
    } catch (error) {
      console.error("Refresh failed:", error);
    }
    // Brief delay so the spin animation is visible
    setTimeout(() => setRefreshing(false), 600);
  };

  return (
    <SearchProvider>
      <Global
        styles={css`
          #app-root {
            height: 600px;
            width: 420px;
          }
        `}
      />

      <Wrapper>
        <Loader>
          <Sidebar />
          <Body>
            <TopBar>
              <RefreshButton onClick={handleRefresh} spinning={refreshing} title="Refresh streams">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                </svg>
                {refreshing ? "Refreshing…" : "Refresh"}
              </RefreshButton>
            </TopBar>
            <ContentArea>
              <Outlet />
            </ContentArea>
          </Body>
        </Loader>
      </Wrapper>
    </SearchProvider>
  );
}

export default Component;
