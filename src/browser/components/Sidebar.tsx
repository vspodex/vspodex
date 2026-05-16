import { IconHeart, IconCalendar, IconSettings } from "@tabler/icons-react";
import tw, { styled } from "twin.macro";
import { NavLink } from "react-router";

const Wrapper = styled.div`
  ${tw`bg-black/10 dark:bg-black/20 grid gap-8 content-between overflow-x-hidden overflow-y-scroll w-16`}

  scrollbar-width: none;

  ::-webkit-scrollbar {
    ${tw`hidden`}
  }
`;

const Header = styled.div`
  ${tw`grid p-4 place-content-center`}
`;

const LogoImg = styled.img`
  ${tw`w-8 h-8 object-contain bg-transparent`}
`;

const Inner = styled.div`
  ${tw`gap-3 grid place-content-center`}
`;

const Footer = styled.div`
  ${tw`grid p-3 place-content-center`}
`;

const StyledLink = styled(NavLink)`
  ${tw`flex items-center justify-center w-10 h-10 rounded-lg text-neutral-500 hover:text-white hover:bg-neutral-700 transition-colors`}

  &.active {
    ${tw`text-indigo-400 bg-indigo-500/20`}
  }
`;

const SettingsLink = styled.a`
  ${tw`flex items-center justify-center w-10 h-10 rounded-lg text-neutral-500 hover:text-white hover:bg-neutral-700 transition-colors cursor-pointer`}
`;

function Sidebar() {
  const openSettings = () => {
    browser.runtime.openOptionsPage();
  };

  return (
    <Wrapper>
      <Header>
        <LogoImg src="/icon-48.png" alt="VspoDex" />
      </Header>
      <Inner>
        <StyledLink to="/streams/live" title="Live Streams">
          <IconHeart size="1.5rem" />
        </StyledLink>
        <StyledLink to="/streams/upcoming" title="Upcoming Streams">
          <IconCalendar size="1.5rem" />
        </StyledLink>
      </Inner>
      <Footer>
        <SettingsLink onClick={openSettings} title="Settings">
          <IconSettings size="1.5rem" />
        </SettingsLink>
      </Footer>
    </Wrapper>
  );
}

export default Sidebar;
