"use client";

import { useCallback, useEffect, useRef } from "react";
import { getRouteApi } from "@tanstack/react-router";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useMediaQuery } from "@/hooks/use-media-query";
import { MEDIA } from "@/lib/breakpoints";
import { useAppState, useT } from "../AppState/use-app-state";
import { MAP_REGION_ID } from "../ExploreControls";
import { BrailleExplorer } from ".";
import { takeBrailleOpener } from "./opener";
import { useLiveBrailleSource } from "./use-live-braille-source";

const route = getRouteApi("/listen");

/**
 * Listen's explorer: today's frames at the app's cursor. From 1024 px it is Listen's right-hand column (the map stays
 * whole on the left); below, a full-screen sheet. `?braille=1` opens it, and the URL follows it. Closing puts focus
 * back on the control that opened it (the map, or the player's More).
 */
export function LiveBrailleExplorer({ className }: { className?: string }) {
  const { state, dispatch } = useAppState();
  const t = useT();
  const source = useLiveBrailleSource();
  const wide = useMediaQuery(MEDIA.mapOverlay);
  const search = route.useSearch();
  const navigate = route.useNavigate();
  const open = state.brailleOpen && state.mode === "explore";

  // Once per close: in the sheet, Escape reaches both the explorer's own handler and the dialog's.
  const closing = useRef(false);
  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    dispatch({ type: "setBrailleOpen", open: false });
    (takeBrailleOpener() ?? document.getElementById(MAP_REGION_ID))?.focus();
  }, [dispatch]);
  useEffect(() => {
    if (state.brailleOpen) closing.current = false;
  }, [state.brailleOpen]);

  // The URL opens it (a shared ?braille=1 link)...
  const shownSearch = useRef<boolean | undefined>(undefined);
  useEffect(() => {
    const wanted = search.braille === true;
    if (shownSearch.current === wanted) return;
    shownSearch.current = wanted;
    if (wanted && !state.brailleOpen) dispatch({ type: "setBrailleOpen", open: true });
  }, [search.braille, state.brailleOpen, dispatch]);
  // ...and follows it: opening adds ?braille=1, closing removes it (the entry is replaced, so Back leaves the page).
  const shownOpen = useRef(state.brailleOpen);
  useEffect(() => {
    if (shownOpen.current === state.brailleOpen) return;
    shownOpen.current = state.brailleOpen;
    shownSearch.current = state.brailleOpen;
    if ((search.braille === true) !== state.brailleOpen) void navigate({ search: (prev) => ({ ...prev, braille: state.brailleOpen ? true : undefined }), replace: true });
  }, [state.brailleOpen, search.braille, navigate]);

  if (!open || !source) return null;
  const explorer = <BrailleExplorer source={source} onClose={close} className={wide ? className : "border-0 shadow-none"} />;
  if (wide) return explorer;
  return (
    <Sheet open onOpenChange={(next) => !next && close()}>
      <SheetContent showCloseButton={false} side="bottom" finalFocus={false} className="h-dvh max-h-dvh overflow-y-auto rounded-none p-0 data-[side=bottom]:top-0 data-[side=bottom]:h-dvh">
        <SheetTitle className="sr-only">{t("braille.heading")}</SheetTitle>
        {explorer}
      </SheetContent>
    </Sheet>
  );
}
