"use client";

import type { ReactNode } from "react";
import { useRecordSounding } from "@/hooks/use-record-sounding";
import { cn } from "@/lib/utils";
import { useT } from "../AppState/use-app-state";
import { CodeChip } from "../Rack/RecordStrip";
import { SplitFlap } from "../SplitFlap";
import { BubbleTube } from "./BubbleTube";
import { Tonearm } from "./Tonearm";

/**
 * The open jukebox: an arched coral crown ("Now playing", the code chip and the title strip), a paper body
 * with an 8 px hard shadow, optional bubble tubes beside the window, and the window itself (`children`).
 * `below` sits inside the body, under the window. One per page.
 */
export function Cabinet({
  code,
  title,
  tubes = false,
  below,
  flush = false,
  slimVeryShort = false,
  foldCrown = false,
  className,
  children,
}: {
  code?: string;
  title?: string;
  tubes?: boolean;
  /** Phones: no body padding, so the window keeps the full width between the page gutters. */
  flush?: boolean;
  /** Wide but very short screens: a slimmer frame (8 px of padding), so the window keeps its height (Official). */
  slimVeryShort?: boolean;
  /** Very short wide screens: the crown folds away to give the window its height (Listen's and Official's maps). */
  foldCrown?: boolean;
  below?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  const t = useT();
  const sounding = useRecordSounding();
  return (
    <div className={cn("flex min-w-0 flex-col items-center", className)}>
      <div data-cabinet-crown className={cn("crown relative z-1 -mb-(--outline-panel) flex h-11 w-[min(100%,36rem)] max-w-full items-center justify-center gap-3 px-10 sm:px-16", foldCrown && "very-short:xl:hidden")}>
        <h2 className="shrink-0 text-body font-semibold">{t("player.nowPlaying")}</h2>
        {code && title && (
          <p className="flex min-w-0 items-center gap-2 rounded-md border-2 border-navy bg-paper py-0.5 pr-3 pl-0.5">
            <CodeChip code={code} className="h-7 w-10 border-0 bg-moon text-ink" />
            <SplitFlap text={title} className="truncate font-strip text-strip" />
          </p>
        )}
        <Tonearm on={sounding} />
      </div>
      <div data-land className={cn("cabinet-body w-full min-w-0 p-4", flush && "max-lg:border-0 max-lg:bg-transparent max-lg:p-0 max-lg:shadow-none", slimVeryShort && "lg:very-short:p-2")}>
        <div className={cn("grid min-w-0 gap-3", tubes && "grid-cols-2 xl:grid-cols-[auto_minmax(0,auto)_auto] xl:justify-center")}>
          <div className={cn("min-w-0", tubes && "col-span-2 xl:col-span-1 xl:col-start-2 xl:row-start-1")}>{children}</div>
          {tubes && <BubbleTube voice="ocean" className="xl:col-start-1 xl:row-start-1" />}
          {tubes && <BubbleTube voice="rain" className="xl:col-start-3 xl:row-start-1" />}
        </div>
        {below}
      </div>
    </div>
  );
}
