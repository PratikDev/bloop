"use client";

import { useEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";
import { modeFromLocation } from "@/router/modes";
import { useAnnounce } from "../Announcer/use-announcer";
import type { Mode } from "../AppState/reducer";
import { useAppState, useT } from "../AppState/use-app-state";
import { MODE_LABELS } from "../Commands/use-commands";
import { NAV_ITEMS } from "../Header/nav-items";

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
 * (screen readers read it; Tab continues from the top of the new page). Only
 * when focus was on the link that moved it (in the header) or was lost with the
 * old page: a page that places focus itself (Listen's map) or an overlay (the
 * intro's Skip button) keeps it.
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

  const firstPath = useRef(pathname);
  useEffect(() => {
    if (pathname === firstPath.current) return;
    firstPath.current = "";
    let tries = 0;
    let frame = requestAnimationFrame(function focusTitle() {
      const heading = document.querySelector<HTMLElement>("[data-page-title]");
      const active = document.activeElement;
      const lost = !active || active === document.body || document.querySelector("header")?.contains(active);
      if (heading && lost) heading.focus({ preventScroll: true });
      else if (++tries < FOCUS_TRIES) frame = requestAnimationFrame(focusTitle);
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname]);
}
