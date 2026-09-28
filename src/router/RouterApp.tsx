"use client";

import { createRouter, RouterProvider } from "@tanstack/react-router";
import { createAppHistory } from "./history";
import { routeTree } from "./routes";

const router = createRouter({
  routeTree,
  history: createAppHistory(),
  // Hovering or focusing a link starts loading that page's code.
  defaultPreload: "intent",
  // "Retuning" between pages only; choices inside a page (a tab, a city, the tour) change in place.
  defaultViewTransition: { types: ({ pathChanged }) => (pathChanged ? ["retune"] : false) },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export function RouterApp() {
  return <RouterProvider router={router} />;
}
