"use client";

import { useRef, useState, type ReactElement, type ReactNode } from "react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { useT } from "../AppState/use-app-state";
import { useRecords } from "../Records/use-records";
import { NowPlaying } from "./NowPlaying";
import { useCaptionLines } from "./use-caption-lines";

/** `trigger` (a button element) opens the "Now playing" sheet: from the right on wide screens, from the bottom on phones. */
export function PlayerSheet({ trigger, children }: { trigger: ReactElement; children: ReactNode }) {
  const { current } = useRecords();
  const t = useT();
  const phone = useMediaQuery("(max-width: 1023px)");
  const [open, setOpen] = useState(false);
  const lines = useCaptionLines();
  const heading = useRef<HTMLHeadingElement>(null);
  if (!current) return null;
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={trigger}>{children}</SheetTrigger>
      <SheetContent
        data-tt-occluder
        closeLabel={t("inspector.close")}
        side={phone ? "bottom" : "right"}
        initialFocus={heading}
        className={cn("overflow-y-auto p-5 text-body", phone ? "max-h-[85dvh] rounded-t-sheet" : "w-full rounded-l-sheet sm:max-w-lg")}
      >
        <SheetTitle ref={heading} tabIndex={-1} className="eyebrow outline-none">
          {t("player.nowPlaying")}
        </SheetTitle>
        <NowPlaying current={current} lines={lines} onPicked={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
