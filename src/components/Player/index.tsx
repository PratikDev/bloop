"use client";

import { useRef } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useMediaQuery } from "@/hooks/use-media-query";
import { MEDIA } from "@/lib/breakpoints";
import { cn } from "@/lib/utils";
import { useT } from "../AppState/use-app-state";
import { useRecords } from "../Records/use-records";
import { NowPlaying } from "./NowPlaying";
import { closePlayerSheet, playerSheetOpener, usePlayerSheetOpen } from "./player-sheet-store";
import { useCaptionLines } from "./use-caption-lines";

/** The "Now playing" sheet, mounted once with the mini player and opened with openPlayerSheet: from the right on wide screens, from the bottom on phones. */
export function PlayerSheet() {
  const { current } = useRecords();
  const t = useT();
  const phone = useMediaQuery(MEDIA.phone);
  const open = usePlayerSheetOpen();
  const lines = useCaptionLines();
  const heading = useRef<HTMLHeadingElement>(null);
  if (!current) return null;
  return (
    <Sheet open={open} onOpenChange={(next) => !next && closePlayerSheet()}>
      <SheetContent
        data-tt-occluder
        closeLabel={t("inspector.close")}
        side={phone ? "bottom" : "right"}
        initialFocus={heading}
        finalFocus={() => playerSheetOpener() ?? true}
        className={cn("overflow-y-auto p-5 text-body", phone ? "max-h-[85dvh] rounded-t-sheet" : "w-full rounded-l-sheet sm:max-w-lg")}
      >
        <SheetTitle ref={heading} tabIndex={-1} className="eyebrow outline-none">
          {t("player.nowPlaying")}
        </SheetTitle>
        <NowPlaying current={current} lines={lines} onPicked={closePlayerSheet} />
      </SheetContent>
    </Sheet>
  );
}
