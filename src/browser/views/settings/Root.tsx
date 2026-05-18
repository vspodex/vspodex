import { css, Global } from "@emotion/react";
import { Outlet, NavLink } from "react-router";
import tw, { styled } from "twin.macro";

import Loader from "~/browser/components/Loader";
import { useTranslation } from "~/browser/hooks";

const Wrapper = styled.div`
  ${tw`flex h-full`}
`;

const SideNav = styled.nav`
  ${tw`w-48 bg-black/5 dark:bg-black/20 p-4 flex flex-col gap-1 overflow-y-auto`}
`;

const NavItem = styled(NavLink)`
  ${tw`block px-3 py-2 rounded-lg text-sm text-neutral-600 dark:text-neutral-400 hover:(bg-neutral-200 dark:bg-neutral-700 text-black dark:text-white) transition-colors no-underline`}

  &.active {
    ${tw`bg-indigo-500/10 text-indigo-500 font-medium`}
  }
`;

const Content = styled.div`
  ${tw`flex-1 p-6 overflow-y-auto`}
`;

const Logo = styled.div`
  ${tw`text-xl font-bold text-indigo-500 mb-6 px-3`}
`;

export function Component() {
  const { t } = useTranslation();

  return (
    <>
      <Global
        styles={css`
          #app-root {
            height: 100vh;
            width: 100vw;
          }
        `}
      />

      <Wrapper>
        <SideNav>
          <Logo>VspoDex</Logo>
          <NavItem to="api-keys">{t("nav_api_keys")}</NavItem>
          <NavItem to="channels">{t("nav_channels")}</NavItem>
          <NavItem to="general">{t("nav_general")}</NavItem>
        </SideNav>

        <Content>
          <Loader>
            <Outlet />
          </Loader>
        </Content>
      </Wrapper>
    </>
  );
}

export default Component;
