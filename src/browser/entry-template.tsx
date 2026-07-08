import "overlayscrollbars/overlayscrollbars.css";

import { Global } from "@emotion/react";
import { EntryWrapper } from "@seldszar/yael";
import { ExoticComponent, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { SWRConfig } from "swr";
import tw, { GlobalStyles, css, theme } from "twin.macro";

import { getBaseFontSize } from "~/common/helpers";

import { usePreferDarkMode, useSettings } from "./hooks";

const wrapper: EntryWrapper<ExoticComponent> = (Component) => {
  document.title = "VspoDex";

  const container = document.getElementById("app-root");

  if (container == null) {
    return;
  }

  const root = createRoot(container);

  function App() {
    const [settings] = useSettings();

    const darkMode = usePreferDarkMode();

    const isSettings = typeof window === "object" && window.location.pathname.includes("settings.html");

    useEffect(() => {
      const memberThemes = [
        "hinano", "lisa", "runa", "yuuhi", "moka", "ramune",
        "sumire", "nazuna", "toto", "uruha", "noa", "kyupi", "beni", "ema", "sena", "ren",
        "mimi", "tsuna", "met", "akari", "kuromu", "kokage"
      ];
      memberThemes.forEach((t) => {
        document.documentElement.classList.remove(`theme-${t}`);
      });

      const isMemberTheme = memberThemes.includes(settings.general.theme);
      const darkMemberThemes = ["ren", "tsuna", "kuromu"];
      const isDarkMemberTheme = darkMemberThemes.includes(settings.general.theme);

      const force =
        isDarkMemberTheme ||
        (!isMemberTheme &&
          (settings.general.theme === "system" ? darkMode : settings.general.theme === "dark"));

      document.documentElement.classList.toggle("dark", force);

      if (isMemberTheme) {
        document.documentElement.classList.add(`theme-${settings.general.theme}`);
      }
    }, [darkMode, settings.general.theme]);

    return (
      <SWRConfig value={{ keepPreviousData: true }}>
        <GlobalStyles />

        <Global
          styles={css`
            ::selection {
              ${tw`bg-indigo-500 text-white`}
            }

            html,
            body {
              font-size: ${getBaseFontSize(settings.general.fontSize, isSettings)};
            }

            html {
              color-scheme: dark;
            }

            body {
              ${tw`bg-neutral-100 font-sans text-black dark:(bg-neutral-900 text-white)`}
            }

            #modal-root {
              ${tw`absolute z-50`}
            }

            .os-theme-vspodex {
              --os-handle-bg-active: ${theme("colors.indigo.600")};
              --os-handle-bg-hover: ${theme("colors.indigo.400")};
              --os-handle-bg: ${theme("colors.indigo.500")};
              --os-handle-border-radius: ${theme("borderRadius.full")};
              --os-handle-interactive-area-offset: 3px;
              --os-padding-axis: 3px;
              --os-padding-perpendicular: 3px;
              --os-size: 8px;

              .os-scrollbar-handle {
                opacity: 0.5;
              }

              &:hover {
                --os-size: 10px;

                .os-scrollbar-handle {
                  opacity: 1;
                }
              }
            }

            /* Member themes definition */
            .theme-hinano {
              --bg-app: #fa96c8;
              --text-app: #4a1525;
              --text-muted: #6b2d3e;
              --bg-card: #fff0f5;
              --bg-sidebar: #fde2ee;
              --border-color: #f8bbd0;
              --accent-color: #e63e75;
              --accent-hover: #d81b60;
              --polka-color: rgba(255, 255, 255, 0.35);
              --bg-sidebar-nav: #3a131a;
              --color-scheme: light;
              --badge-green-text: #166534;
              --badge-green-bg: #dcfce7;
              --badge-red-text: #991b1b;
              --badge-red-bg: #fee2e2;
            }
            .theme-lisa {
              --bg-app: #d1de79;
              --text-app: #2b3b0c;
              --text-muted: #415418;
              --bg-card: #f7fbe3;
              --bg-sidebar: #eff6c4;
              --border-color: #c2ce6d;
              --accent-color: #829a26;
              --accent-hover: #6b801e;
              --polka-color: rgba(255, 255, 255, 0.35);
              --bg-sidebar-nav: #232a10;
              --color-scheme: light;
              --badge-green-text: #166534;
              --badge-green-bg: #dcfce7;
              --badge-red-text: #991b1b;
              --badge-red-bg: #fee2e2;
            }
            .theme-runa {
              --bg-app: #d6adff;
              --text-app: #26004c;
              --text-muted: #48167a;
              --bg-card: #f6efff;
              --bg-sidebar: #ecdbff;
              --border-color: #c294f5;
              --accent-color: #9a54e6;
              --accent-hover: #833bce;
              --polka-color: rgba(255, 255, 255, 0.35);
              --bg-sidebar-nav: #130924;
              --color-scheme: light;
              --badge-green-text: #166534;
              --badge-green-bg: #dcfce7;
              --badge-red-text: #991b1b;
              --badge-red-bg: #fee2e2;
            }
            .theme-yuuhi {
              --bg-app: #ed784a;
              --text-app: #3d1000;
              --text-muted: #66240b;
              --bg-card: #fff4ee;
              --bg-sidebar: #ffe4d6;
              --border-color: #e0693b;
              --accent-color: #c74415;
              --accent-hover: #aa340a;
              --polka-color: rgba(255, 255, 255, 0.35);
              --bg-sidebar-nav: #240e06;
              --color-scheme: light;
              --badge-green-text: #166534;
              --badge-green-bg: #dcfce7;
              --badge-red-text: #991b1b;
              --badge-red-bg: #fee2e2;
            }
            .theme-moka {
              --bg-app: #eca0aa;
              --text-app: #3d0b12;
              --text-muted: #661b26;
              --bg-card: #fff5f6;
              --bg-sidebar: #fad5d9;
              --border-color: #df8f99;
              --accent-color: #d25466;
              --accent-hover: #b63e4f;
              --polka-color: rgba(255, 255, 255, 0.35);
              --bg-sidebar-nav: #30090e;
              --color-scheme: light;
              --badge-green-text: #166534;
              --badge-green-bg: #dcfce7;
              --badge-red-text: #991b1b;
              --badge-red-bg: #fee2e2;
            }
            .theme-ramune {
              --bg-app: #8eced9;
              --text-app: #0b2f36;
              --text-muted: #174e58;
              --bg-card: #ebf7f9;
              --bg-sidebar: #ceeff4;
              --border-color: #7ebcc6;
              --accent-color: #2e8896;
              --accent-hover: #226e7a;
              --polka-color: rgba(255, 255, 255, 0.35);
              --bg-sidebar-nav: #0b2126;
              --color-scheme: light;
              --badge-green-text: #166534;
              --badge-green-bg: #dcfce7;
              --badge-red-text: #991b1b;
              --badge-red-bg: #fee2e2;
            }
            .theme-sumire {
              --bg-app: #eef2ff;
              --text-app: #1e293b;
              --text-muted: #475569;
              --bg-card: #ffffff;
              --bg-sidebar: #e0e7ff;
              --border-color: #c7d2fe;
              --accent-color: #85a3ff;
              --accent-hover: #5c85ff;
              --polka-color: rgba(255, 255, 255, 0.35);
              --bg-sidebar-nav: #1e1b4b;
              --color-scheme: light;
              --badge-green-text: #166534;
              --badge-green-bg: #dcfce7;
              --badge-red-text: #991b1b;
              --badge-red-bg: #fee2e2;
            }
            .theme-nazuna {
              --bg-app: #ffe5eb;
              --text-app: #5a1023;
              --text-muted: #801c34;
              --bg-card: #fff5f7;
              --bg-sidebar: #ffebef;
              --border-color: #ffc2d1;
              --accent-color: #ff4d79;
              --accent-hover: #d9305b;
              --polka-color: rgba(255, 255, 255, 0.35);
              --bg-sidebar-nav: #3a0815;
              --color-scheme: light;
              --badge-green-text: #166534;
              --badge-green-bg: #dcfce7;
              --badge-red-text: #991b1b;
              --badge-red-bg: #fee2e2;
            }
            .theme-toto {
              --bg-app: #fffdeb;
              --text-app: #1c2d2e;
              --text-muted: #385254;
              --bg-card: #ffffff;
              --bg-sidebar: #fffbe0;
              --border-color: #f0e2b6;
              --accent-color: #b2cfd1;
              --accent-hover: #8ebbc0;
              --polka-color: rgba(255, 255, 255, 0.4);
              --bg-sidebar-nav: #1c2d2e;
              --color-scheme: light;
              --badge-green-text: #166534;
              --badge-green-bg: #dcfce7;
              --badge-red-text: #991b1b;
              --badge-red-bg: #fee2e2;
            }
            .theme-uruha {
              --bg-app: #c7d8ff;
              --text-app: #0c1b40;
              --text-muted: #182d66;
              --bg-card: #f0f4ff;
              --bg-sidebar: #e0e8ff;
              --border-color: #a3beff;
              --accent-color: #3d70f5;
              --accent-hover: #2454d1;
              --polka-color: rgba(255, 255, 255, 0.35);
              --bg-sidebar-nav: #081026;
              --color-scheme: light;
              --badge-green-text: #166534;
              --badge-green-bg: #dcfce7;
              --badge-red-text: #991b1b;
              --badge-red-bg: #fee2e2;
            }
            .theme-noa {
              --bg-app: #c2f0f5;
              --text-app: #07353b;
              --text-muted: #11525b;
              --bg-card: #f0fafc;
              --bg-sidebar: #daf5f7;
              --border-color: #9ee3eb;
              --accent-color: #13b5c7;
              --accent-hover: #0d93a3;
              --polka-color: rgba(255, 255, 255, 0.35);
              --bg-sidebar-nav: #041f24;
              --color-scheme: light;
              --badge-green-text: #166534;
              --badge-green-bg: #dcfce7;
              --badge-red-text: #991b1b;
              --badge-red-bg: #fee2e2;
            }
            .theme-kyupi {
              --bg-app: #fff0bd;
              --text-app: #3d2b00;
              --text-muted: #5e4505;
              --bg-card: #fffcf2;
              --bg-sidebar: #fff7d9;
              --border-color: #fadb7d;
              --accent-color: #d99e04;
              --accent-hover: #b88400;
              --polka-color: rgba(255, 255, 255, 0.35);
              --bg-sidebar-nav: #241700;
              --color-scheme: light;
              --badge-green-text: #166534;
              --badge-green-bg: #dcfce7;
              --badge-red-text: #991b1b;
              --badge-red-bg: #fee2e2;
            }
            .theme-beni {
              --bg-app: #f0faf7;
              --text-app: #163b30;
              --text-muted: #2d5e50;
              --bg-card: #ffffff;
              --bg-sidebar: #e2f5ee;
              --border-color: #c3ebe0;
              --accent-color: #51bfa0;
              --accent-hover: #3ea387;
              --polka-color: rgba(255, 255, 255, 0.35);
              --bg-sidebar-nav: #153329;
              --color-scheme: light;
              --badge-green-text: #166534;
              --badge-green-bg: #dcfce7;
              --badge-red-text: #991b1b;
              --badge-red-bg: #fee2e2;
            }
            .theme-ema {
              --bg-app: #f2fcfd;
              --text-app: #12393d;
              --text-muted: #25585d;
              --bg-card: #ffffff;
              --bg-sidebar: #e3f9fc;
              --border-color: #c7f4fa;
              --accent-color: #6ad5e6;
              --accent-hover: #4ebbc8;
              --polka-color: rgba(255, 255, 255, 0.35);
              --bg-sidebar-nav: #173e42;
              --color-scheme: light;
              --badge-green-text: #166534;
              --badge-green-bg: #dcfce7;
              --badge-red-text: #991b1b;
              --badge-red-bg: #fee2e2;
            }
            .theme-sena {
              --bg-app: #f8f9fa;
              --text-app: #212529;
              --text-muted: #495057;
              --bg-card: #ffffff;
              --bg-sidebar: #f1f3f5;
              --border-color: #dee2e6;
              --accent-color: #9ca3af;
              --accent-hover: #6b7280;
              --polka-color: rgba(0, 0, 0, 0.05);
              --bg-sidebar-nav: #1f2937;
              --color-scheme: light;
              --badge-green-text: #166534;
              --badge-green-bg: #dcfce7;
              --badge-red-text: #991b1b;
              --badge-red-bg: #fee2e2;
            }
            .theme-ren {
              --bg-app: #1c1215;
              --text-app: #ffffff;
              --text-muted: #cca3b0;
              --bg-card: #2a1b20;
              --bg-sidebar: #211518;
              --border-color: #3d2830;
              --accent-color: #BE2152;
              --accent-hover: #a31a43;
              --polka-color: rgba(255, 255, 255, 0.15);
              --bg-sidebar-nav: #0f090b;
              --color-scheme: dark;
              --badge-green-text: #4ade80;
              --badge-green-bg: rgba(74, 222, 128, 0.2);
              --badge-red-text: #f87171;
              --badge-red-bg: rgba(248, 113, 113, 0.2);
            }
            .theme-mimi {
              --bg-app: #ffe6ef;
              --text-app: #470b22;
              --text-muted: #782547;
              --bg-card: #ffffff;
              --bg-sidebar: #ffd1e1;
              --border-color: #fca5c5;
              --accent-color: #e05a8f;
              --accent-hover: #c23c6f;
              --polka-color: rgba(255, 255, 255, 0.45);
              --bg-sidebar-nav: #ffeef4;
              --color-scheme: light;
              --badge-green-text: #166534;
              --badge-green-bg: #dcfce7;
              --badge-red-text: #991b1b;
              --badge-red-bg: #fee2e2;
            }
            .theme-tsuna {
              --bg-app: #1c1213;
              --text-app: #ffffff;
              --text-muted: #cca3a7;
              --bg-card: #2b1c1e;
              --bg-sidebar: #26181a;
              --border-color: #422b2e;
              --accent-color: #c81c31;
              --accent-hover: #a31424;
              --polka-color: rgba(255, 255, 255, 0.15);
              --bg-sidebar-nav: #121212;
              --color-scheme: dark;
              --badge-green-text: #4ade80;
              --badge-green-bg: rgba(74, 222, 128, 0.2);
              --badge-red-text: #f87171;
              --badge-red-bg: rgba(248, 113, 113, 0.2);
            }
            .theme-met {
              --bg-app: #faf6eb;
              --text-app: #3d2105;
              --text-muted: #6b3f15;
              --bg-card: #ffffff;
              --bg-sidebar: #f4eccf;
              --border-color: #ebdcb4;
              --accent-color: #d67d22;
              --accent-hover: #b86414;
              --polka-color: rgba(255, 255, 255, 0.5);
              --bg-sidebar-nav: #3e3a39;
              --color-scheme: light;
              --badge-green-text: #166534;
              --badge-green-bg: #dcfce7;
              --badge-red-text: #991b1b;
              --badge-red-bg: #fee2e2;
            }
            .theme-akari {
              --bg-app: #fdf1ed;
              --text-app: #3d1a10;
              --text-muted: #6b3728;
              --bg-card: #ffffff;
              --bg-sidebar: #fadcd2;
              --border-color: #f5c5b8;
              --accent-color: #4a9eb5;
              --accent-hover: #338299;
              --polka-color: rgba(255, 255, 255, 0.45);
              --bg-sidebar-nav: #e58367;
              --color-scheme: light;
              --badge-green-text: #166534;
              --badge-green-bg: #dcfce7;
              --badge-red-text: #991b1b;
              --badge-red-bg: #fee2e2;
            }
            .theme-kuromu {
              --bg-app: #13161c;
              --text-app: #ffffff;
              --text-muted: #a6b2c7;
              --bg-card: #222731;
              --bg-sidebar: #1a1e26;
              --border-color: #333a49;
              --accent-color: #8ba0c2;
              --accent-hover: #6f85a8;
              --polka-color: rgba(255, 255, 255, 0.12);
              --bg-sidebar-nav: #0f1115;
              --color-scheme: dark;
              --badge-green-text: #4ade80;
              --badge-green-bg: rgba(74, 222, 128, 0.2);
              --badge-red-text: #f87171;
              --badge-red-bg: rgba(248, 113, 113, 0.2);
            }
            .theme-kokage {
              --bg-app: #e8f1f7;
              --text-app: #0e263f;
              --text-muted: #2c5178;
              --bg-card: #ffffff;
              --bg-sidebar: #d0e2ef;
              --border-color: #a9cbe2;
              --accent-color: #3572b6;
              --accent-hover: #265a94;
              --polka-color: rgba(255, 255, 255, 0.45);
              --bg-sidebar-nav: #3572b6;
              --color-scheme: light;
              --badge-green-text: #166534;
              --badge-green-bg: #dcfce7;
              --badge-red-text: #991b1b;
              --badge-red-bg: #fee2e2;
            }

            /* Global overrides when any member theme is active */
            .theme-hinano,
            .theme-lisa,
            .theme-runa,
            .theme-yuuhi,
            .theme-moka,
            .theme-ramune,
            .theme-sumire,
            .theme-nazuna,
            .theme-toto,
            .theme-uruha,
            .theme-noa,
            .theme-kyupi,
            .theme-beni,
            .theme-ema,
            .theme-sena,
            .theme-ren,
            .theme-mimi,
            .theme-tsuna,
            .theme-met,
            .theme-akari,
            .theme-kuromu,
            .theme-kokage {
              background-color: var(--bg-app) !important;
              color: var(--text-app) !important;
              color-scheme: var(--color-scheme) !important;

              &, body {
                background-color: var(--bg-app) !important;
                color: var(--text-app) !important;
              }

              #app-root {
                background-color: var(--bg-app) !important;
                color: var(--text-app) !important;
                position: relative;

                &::before {
                  content: "";
                  position: absolute;
                  inset: 0;
                  pointer-events: none;
                  z-index: 0;
                  background-image: radial-gradient(var(--polka-color) 18%, transparent 19%);
                  background-size: 24px 24px;
                  -webkit-mask-image: 
                    radial-gradient(circle at bottom left, black 0%, black 100px, transparent 250px),
                    radial-gradient(circle at bottom right, black 0%, black 100px, transparent 250px);
                  mask-image: 
                    radial-gradient(circle at bottom left, black 0%, black 100px, transparent 250px),
                    radial-gradient(circle at bottom right, black 0%, black 100px, transparent 250px);
                }

                .settings-logo {
                  color: #ff91c8 !important;
                }
              }

              /* Sidebar Nav styling */
              .sidebar-nav, .settings-sidenav {
                background-color: var(--bg-sidebar-nav) !important;
                
                a, button {
                  color: rgba(255, 255, 255, 0.5) !important;
                  background-color: transparent !important;
                  
                  svg {
                    color: rgba(255, 255, 255, 0.5) !important;
                  }
                  
                  &:hover {
                    color: #ffffff !important;
                    background-color: rgba(255, 255, 255, 0.1) !important;
                    
                    svg {
                      color: #ffffff !important;
                    }
                  }
                  
                  &.active {
                    background-color: var(--accent-color) !important;
                    color: #ffffff !important;
                    
                    svg {
                      color: #ffffff !important;
                    }
                  }
                }
              }

              /* Primary and neutral text overrides */
              .text-black,
              .text-neutral-900,
              .text-neutral-800,
              .text-neutral-700,
              .text-neutral-600,
              h1, h2, h3, h4, h5, h6, span, p, div, label {
                &:not(.text-white):not(.text-red-500):not(.text-red-400):not(.text-green-500):not(.text-green-400):not(.text-indigo-500):not(.text-indigo-600):not(.text-neutral-500):not(.text-neutral-400) {
                  color: var(--text-app) !important;
                }
              }
              
              .text-neutral-500,
              .text-neutral-400 {
                color: var(--text-muted) !important;
              }

              /* Active state highlights, lists, buttons */
              .text-indigo-600,
              .text-indigo-500,
              .text-red-600,
              .text-red-500 {
                color: var(--accent-color) !important;
              }

              .border-indigo-600,
              .border-indigo-500,
              .border-red-600,
              .border-red-500 {
                border-color: var(--accent-color) !important;
              }

              /* Standard container backgrounds */
              .bg-white,
              .bg-neutral-100,
              .bg-neutral-200,
              .bg-neutral-700,
              .bg-neutral-800,
              .bg-neutral-900 {
                background-color: var(--bg-card) !important;
              }
              
              .bg-neutral-300 {
                background-color: var(--border-color) !important;
              }

              /* Sidebar, header backgrounds */
              .bg-neutral-50,
              .bg-neutral-900\/50,
              .bg-neutral-900\/30 {
                background-color: var(--bg-sidebar) !important;
              }

              /* Form controls */
              select,
              input[type="text"],
              input[type="password"],
              textarea {
                background-color: var(--bg-card) !important;
                color: var(--text-app) !important;
                border-color: var(--border-color) !important;
                
                &:focus {
                  border-color: var(--accent-color) !important;
                  box-shadow: 0 0 0 2px var(--border-color) !important;
                }
              }

              /* Status Badge styles */
              .settings-status-badge {
                &.text-green-400 {
                  color: var(--badge-green-text) !important;
                  background-color: var(--badge-green-bg) !important;
                }
                &.text-red-400 {
                  color: var(--badge-red-text) !important;
                  background-color: var(--badge-red-bg) !important;
                }
              }

              /* Border overrides */
              .border-neutral-200,
              .border-neutral-300,
              .border-neutral-700,
              .border-neutral-800,
              .border,
              .border-b,
              .border-t,
              .border-l,
              .border-r {
                border-color: var(--border-color) !important;
              }

              /* Sidebar navigation highlights */
              .hover\:text-white:hover {
                color: var(--accent-color) !important;
              }
              .hover\:bg-neutral-700:hover {
                background-color: var(--bg-sidebar) !important;
              }
              a.active {
                background-color: var(--accent-color) !important;
                color: #ffffff !important;
              }

              /* Buttons */
              button.bg-indigo-600,
              button.bg-indigo-500,
              .bg-indigo-600,
              .bg-indigo-500 {
                background-color: var(--accent-color) !important;
                color: #ffffff !important;
                
                &:hover {
                  background-color: var(--accent-hover) !important;
                }
              }

              /* Selection */
              ::selection {
                background-color: var(--accent-color) !important;
                color: #ffffff !important;
              }

              /* Custom scrollbars */
              .os-theme-vspodex {
                --os-handle-bg: var(--accent-color) !important;
                --os-handle-bg-hover: var(--accent-hover) !important;
                --os-handle-bg-active: var(--accent-hover) !important;
              }

              /* Card placeholder background (e.g. for streams duration or channel rows) */
              .bg-neutral-700 {
                background-color: var(--border-color) !important;
              }
            }
          `}
        />

        <Component />
      </SWRConfig>
    );
  }

  root.render(<App />);
};

export default wrapper;
