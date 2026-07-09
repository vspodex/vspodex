import { IconHeart, IconCalendar, IconHistory, IconUsers, IconSettings, IconBolt, IconBoltOff } from "@tabler/icons-react";
import tw, { styled } from "twin.macro";
import { NavLink } from "react-router";

import { useTranslation, useSidebarTabOrder, useAutoOpenFavoritesArmed, useSettings, useAutoOpenedStreams, useStreakCount } from "~/browser/hooks";
import { sendRuntimeMessage } from "~/common/helpers";

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
  ${tw`grid p-3 place-content-center gap-3`}
`;

const StyledLink = styled(NavLink)`
  ${tw`flex items-center justify-center w-10 h-10 rounded-lg text-neutral-500 hover:text-white hover:bg-neutral-700 transition-colors`}

  &.active {
    ${tw`text-indigo-400 bg-indigo-500/20`}
  }
`;

const SettingsLink = styled.button`
  ${tw`flex items-center justify-center w-10 h-10 rounded-lg text-neutral-500 hover:text-white hover:bg-neutral-700 transition-colors cursor-pointer bg-transparent border-none outline-none p-0`}
`;

const ArmedToggleLink = styled.button<{ mode: "disarmed" | "armed" | "streak" }>`
  ${tw`relative flex items-center justify-center w-10 h-10 rounded-lg transition-all cursor-pointer bg-transparent border-none outline-none p-0`}
  ${(props) => {
    if (props.mode === "streak") {
      return tw`text-amber-400 bg-amber-500/25 shadow-[0_0_8px_rgba(245,158,11,0.5)]`;
    }
    if (props.mode === "armed") {
      return tw`text-amber-400 bg-amber-500/10`;
    }
    return tw`text-neutral-500 hover:text-white hover:bg-neutral-700`;
  }}
`;

const StreakBadge = styled.div`
  ${tw`absolute -top-1.5 -right-1.5 bg-amber-500 text-black text-[9px] font-extrabold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center shadow-[0_0_6px_rgba(245,158,11,0.8)] pointer-events-none border border-black/10`}
`;

function Sidebar() {
  const { t } = useTranslation();
  const [sidebarTabOrder] = useSidebarTabOrder({ suspense: true });
  const [armed, armedStore] = useAutoOpenFavoritesArmed({ suspense: true });
  const [autoOpened] = useAutoOpenedStreams({ suspense: true });
  const [settings] = useSettings({ suspense: true });
  const [streakCount, streakCountStore] = useStreakCount({ suspense: true });

  const hasActiveStreak = autoOpened?.some(x => x.mode === "streak") ?? false;
  const displayMode = hasActiveStreak ? "streak" : armed;

  const openSettings = async () => {
    const targetUrl = browser.runtime.getURL("settings.html#/channels");
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

  const tabMap = {
    live: (
      <StyledLink key="live" to="/streams/live" title={t("tooltip_live_streams")}>
        <IconHeart size="1.5rem" />
      </StyledLink>
    ),
    upcoming: (
      <StyledLink key="upcoming" to="/streams/upcoming" title={t("tooltip_upcoming_streams")}>
        <IconCalendar size="1.5rem" />
      </StyledLink>
    ),
    past: (
      <StyledLink key="past" to="/streams/past" title={t("tooltip_past_streams")}>
        <IconHistory size="1.5rem" />
      </StyledLink>
    ),
    members: (
      <StyledLink key="members" to="/streams/members" title={t("tooltip_members")}>
        <IconUsers size="1.5rem" />
      </StyledLink>
    ),
  };

  return (
    <Wrapper className="sidebar-nav">
      <Header>
        <LogoImg src="/icon-48.png" alt="VspoDex" />
      </Header>
      <Inner>
        {sidebarTabOrder.map((tabKey) => tabMap[tabKey as keyof typeof tabMap])}
      </Inner>
      <Footer>
        <ArmedToggleLink
          onClick={async () => {
            const isExperimentalOn = settings.general.autoRearmFavorites === true;
            if (displayMode === "streak") {
              await sendRuntimeMessage("cancelStreakTracking");
              await armedStore.set("disarmed");
            } else if (displayMode === "armed") {
              if (isExperimentalOn) {
                await armedStore.set("streak");
                await streakCountStore.set(0);
              } else {
                await armedStore.set("disarmed");
              }
            } else {
              await armedStore.set("armed");
            }
          }}
          mode={displayMode}
          title={
            displayMode === "streak"
              ? t("tooltip_auto_open_streak")
              : displayMode === "armed"
              ? t("tooltip_auto_open_armed")
              : t("tooltip_auto_open_disarmed")
          }
        >
          {displayMode === "disarmed" ? (
            <IconBoltOff size="1.5rem" />
          ) : displayMode === "armed" ? (
            <IconBolt size="1.5rem" fill="none" />
          ) : (
            <IconBolt size="1.5rem" fill="currentColor" className="animate-pulse" />
          )}
          {streakCount !== undefined && streakCount >= 1 && (
            <StreakBadge>{streakCount}</StreakBadge>
          )}
        </ArmedToggleLink>
        <SettingsLink onClick={openSettings} title={t("tooltip_settings")}>
          <IconSettings size="1.5rem" />
        </SettingsLink>
      </Footer>
    </Wrapper>
  );
}

export default Sidebar;
