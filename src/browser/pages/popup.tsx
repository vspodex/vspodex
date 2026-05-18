import { createHashRouter, Navigate, RouterProvider } from "react-router";

const router = createHashRouter([
  {
    index: true,
    element: <Navigate replace to="streams/live" />,
  },
  {
    lazy: () => import("../views/popup/Root"),
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
            lazy: () => import("../views/popup/LiveStreams"),
          },
          {
            path: "upcoming",
            lazy: () => import("../views/popup/UpcomingStreams"),
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
