"use client";

import { useEffect, useRef } from "react";
import { useRouter, useRouterState } from "@tanstack/react-router";
import { modeFromLocation } from "@/router/modes";
import { useAnnounce } from "../Announcer/use-announcer";
import type { Mode } from "../AppState/reducer";
import { useAppState, useT } from "../AppState/use-app-state";
import { MODE_LABELS } from "../Commands/use-commands";
import { NAV_ITEMS } from "../Header/nav-items";
import { titleFocus } from "./focus-title";

const FOCUS_TRIES = 60; // frames: a page whose code is still loading gets about a second

/** The page on screen: the resolved location (a page whose code is still loading isn't shown yet). */
function useShownPath(): string {
  return useRouterState({ select: (s) => (s.resolvedLocation ?? s.location).pathname });
}

/** The mode the URL asks for (the one source of the mode). */
export function useUrlMode(): Mode {
  const pathname = useShownPath();
  const tour = useRouterState({
    select: (s) => {
      const search = (s.resolvedLocation ?? s.location).search;
      return "tour" in search && search.tour === true;
    },
  });
  return modeFromLocation(pathname, tour ? { tour } : {});
}

/**
 * Keeps the app in step with the URL: copies the mode into the state, names
 * the browser tab, and after moving to another page puts focus on its heading
 * (screen readers read it; Tab continues from the top of the new page), by the
 * rule in `focus-title.ts`.
 */
export function useRouteSync(): void {
  const { state, dispatch } = useAppState();
  const t = useT();
  const announce = useAnnounce();
  const pathname = useShownPath();
  const mode = useUrlMode();

  useEffect(() => {
    if (mode === state.mode) return;
    dispatch({ type: "setMode", mode });
    // The tour changes the Listen page in place (no new heading), so it is announced.
    if (mode === "story") announce(t("announce.mode", { mode: t(MODE_LABELS.story) }));
  }, [mode, state.mode, dispatch, announce, t]);

  const page = NAV_ITEMS.find((item) => item.to === pathname);
  const title = page ? `${t(page.label)} · ${t("app.title")}` : t("app.title");
  useEffect(() => {
    document.title = title;
  }, [title]);

  // Where focus was when the move began (the header link that moved it, Start, an overlay): read then, not once the
  // new page has loaded, so a link Tabbed to while the page's code loads isn't taken for the one that moved it.
  const router = useRouter();
  const movedFrom = useRef<Element | null>(null);
  useEffect(
    () => router.subscribe("onBeforeNavigate", (e) => {
      if (e.pathChanged) movedFrom.current = document.activeElement;
    }),
    [router],
  );

  const firstPath = useRef(pathname);
  useEffect(() => {
    if (pathname === firstPath.current) return;
    firstPath.current = "";
    const from = movedFrom.current ?? document.activeElement;
    let tries = 0;
    let frame = requestAnimationFrame(function focusTitle() {
      const heading = document.querySelector<HTMLElement>("[data-page-title]");
      const active = document.activeElement;
      const next = titleFocus({
        lost: !active || active === document.body,
        unmoved: active === from,
        inHeader: Boolean(active && document.querySelector("header")?.contains(active)),
        heading: Boolean(heading),
      });
      if (next === "focus") heading?.focus({ preventScroll: true });
      else if (next === "wait" && ++tries < FOCUS_TRIES) frame = requestAnimationFrame(focusTitle);
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname]);
}
