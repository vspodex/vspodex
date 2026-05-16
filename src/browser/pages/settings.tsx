import { createHashRouter, Navigate, RouterProvider } from "react-router";

import { SettingsProvider } from "../contexts";

const router = createHashRouter([
  {
    index: true,
    element: <Navigate replace to="api-keys" />,
  },
  {
    lazy: () => import("../views/settings/Root"),
    children: [
      {
        path: "api-keys",
        lazy: () => import("../views/settings/ApiKeySettings"),
      },
      {
        path: "channels",
        lazy: () => import("../views/settings/ChannelSettings"),
      },
      {
        path: "general",
        lazy: () => import("../views/settings/GeneralSettings"),
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
