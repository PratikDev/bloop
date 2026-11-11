"use client";

import { lazy, Suspense } from "react";
import { useT } from "../AppState/use-app-state";
import { useRecords } from "../Records/use-records";
import { PageLoading } from "../PageLoading";
import { SideSheet } from "../SideSheet";
import { closePlayerSheet, playerSheetOpener, usePlayerSheetOpen } from "./player-sheet-store";
import { useCaptionLines } from "./use-caption-lines";

// The sheet's contents load the first time it opens.
const NowPlaying = lazy(() => import("./NowPlaying").then((m) => ({ default: m.NowPlaying })));

/** The "Now playing" sheet, mounted once with the mini player and opened with openPlayerSheet. */
export function PlayerSheet() {
  const { current } = useRecords();
  const t = useT();
  const open = usePlayerSheetOpen();
  const lines = useCaptionLines();
  if (!current) return null;
  return (
    <SideSheet open={open} onClose={closePlayerSheet} title={t("player.nowPlaying")} opener={playerSheetOpener}>
      <Suspense fallback={<PageLoading className="grid min-h-64 place-items-center" />}>
        <NowPlaying current={current} lines={lines} onPicked={closePlayerSheet} />
      </Suspense>
    </SideSheet>
  );
}
