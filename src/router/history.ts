import { createBrowserHistory, type RouterHistory } from "@tanstack/react-router";

type HistoryWrite = History["pushState"];
type NextState = { __NA?: boolean } | null | undefined;

/** Next's own bookkeeping entries carry `__NA` (see next/dist/client/components/app-router.js). */
const isNextWrite = (data: unknown) => (data as NextState)?.__NA === true;

/**
 * TanStack Router's history, kept apart from Next's router.
 *
 * Next hosts the app through one catch-all page, but its router still writes to the
 * history: after a URL change it calls `replaceState` from a React insertion effect.
 * TanStack patches `pushState`/`replaceState` to watch for outside changes, so it
 * would start loading inside that effect (a React error) and lose its entry keys.
 * Next's writes therefore bypass TanStack's patch and keep TanStack's keys.
 */
export function createAppHistory(): RouterHistory {
  const nextWrites = { pushState: window.history.pushState, replaceState: window.history.replaceState };
  const routerHistory = createBrowserHistory();
  for (const method of ["pushState", "replaceState"] as const) {
    const watched: HistoryWrite = window.history[method];
    window.history[method] = function (data, unused, url) {
      if (!isNextWrite(data)) return watched.call(window.history, data, unused, url);
      const current: unknown = window.history.state;
      const merged: unknown = typeof current === "object" && current !== null ? { ...current, ...(data as object) } : data;
      return nextWrites[method].call(window.history, merged, unused, url);
    };
  }
  return routerHistory;
}
