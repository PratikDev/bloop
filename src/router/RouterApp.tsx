"use client";

import { useEffect } from "react";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { PageLoading } from "@/components/PageLoading";
import { createAppHistory } from "./history";
import { routeTree } from "./routes";

const router = createRouter({
  routeTree,
  history: createAppHistory(),
  // Hovering or focusing a link starts loading that page's code.
  defaultPreload: "intent",
  // "Retuning" between pages only; choices inside a page (a tab, a city, the tour) change in place.
  defaultViewTransition: { types: ({ pathChanged }) => (pathChanged ? ["retune"] : false) },
  // ── Session B (performance): a page whose code is still on its way shows the site's loading badge.
  defaultPendingComponent: PageLoading,
  // ── end Session B
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

/** A page change that starts while the last one's view transition runs skips that transition: the browser rejects
 *  its promises ("Transition was skipped"), which is expected and harmless, so only that rejection is caught. */
function isSkippedTransition(reason: unknown): boolean {
  return reason instanceof DOMException && reason.name === "AbortError" && /transition was skipped/iu.test(reason.message);
}

export function RouterApp() {
  useEffect(() => {
    const quiet = (e: PromiseRejectionEvent) => {
      if (isSkippedTransition(e.reason)) e.preventDefault();
    };
    window.addEventListener("unhandledrejection", quiet);
    return () => window.removeEventListener("unhandledrejection", quiet);
  }, []);
  return <RouterProvider router={router} />;
}
