import { css, Global } from "@emotion/react";
import { Outlet } from "react-router";
import tw, { styled } from "twin.macro";

import { SearchProvider } from "~/browser/contexts";

import Loader from "~/browser/components/Loader";
import Sidebar from "~/browser/components/Sidebar";

const Wrapper = styled.div`
  ${tw`flex h-full relative`}
`;

const Body = styled.div`
  ${tw`flex-1 overflow-hidden flex flex-col`}
`;

const ContentArea = styled.div`
  ${tw`flex-1 overflow-y-auto`}
`;

export function Component() {
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
