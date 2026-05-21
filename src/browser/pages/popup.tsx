import { createHashRouter, Navigate, RouterProvider } from "react-router";
import PopupRoot from "../views/popup/Root";
import LiveStreams from "../views/popup/LiveStreams";
import UpcomingStreams from "../views/popup/UpcomingStreams";
import PastStreams from "../views/popup/PastStreams";

const router = createHashRouter([
  {
    index: true,
    element: <Navigate replace to="streams/live" />,
  },
  {
    Component: PopupRoot,
    hydrateFallbackElement: <div>Loading...</div>,
    children: [
      {
        path: "streams",
        children: [
          {
            index: true,
            element: <Navigate replace to="live" />,
          },
          {
            path: "live",
            Component: LiveStreams,
          },
          {
            path: "upcoming",
            Component: UpcomingStreams,
          },
          {
            path: "past",
            Component: PastStreams,
          },
        ],
      },
    ],
  },
]);

function Page() {
  return <RouterProvider router={router} />;
}

export default Page;

