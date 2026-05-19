import { createHashRouter, Navigate, RouterProvider } from "react-router";
import { SettingsProvider } from "../contexts";
import SettingsRoot from "../views/settings/Root";
import ApiKeySettings from "../views/settings/ApiKeySettings";
import ChannelSettings from "../views/settings/ChannelSettings";
import GeneralSettings from "../views/settings/GeneralSettings";

const router = createHashRouter([
  {
    index: true,
    element: <Navigate replace to="api-keys" />,
  },
  {
    Component: SettingsRoot,
    hydrateFallbackElement: <div>Loading...</div>,
    children: [
      {
        path: "api-keys",
        Component: ApiKeySettings,
      },
      {
        path: "channels",
        Component: ChannelSettings,
      },
      {
        path: "general",
        Component: GeneralSettings,
      },
    ],
  },
]);

function Page() {
  return (
    <SettingsProvider>
      <RouterProvider router={router} />
    </SettingsProvider>
  );
}

export default Page;
