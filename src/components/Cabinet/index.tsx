"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useT } from "../AppState/use-app-state";
import { CodeChip } from "../Rack/RecordStrip";
import { BubbleTube } from "./BubbleTube";

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
  className,
  children,
}: {
  code?: string;
  title?: string;
  tubes?: boolean;
  below?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  const t = useT();
  return (
    <div className={cn("flex min-w-0 flex-col items-center", className)}>
      <div data-cabinet-crown className="crown relative z-1 -mb-(--outline-panel) flex w-[min(100%,36rem)] max-w-full items-center justify-center gap-3 px-10 py-2 sm:px-16">
        <h2 className="shrink-0 text-body font-semibold">{t("player.nowPlaying")}</h2>
        {code && title && (
          <p className="flex min-w-0 items-center gap-2 rounded-md border-2 border-navy bg-paper py-0.5 pr-3 pl-0.5">
            <CodeChip code={code} className="h-8 w-10 border-0 bg-moon text-ink" />
            <span className="truncate font-strip text-strip">{title}</span>
          </p>
        )}
      </div>
      <div className="cabinet-body w-full min-w-0 p-3">
        <div className={cn("grid min-w-0 gap-3", tubes && "lg:grid-cols-[auto_minmax(0,auto)_auto] lg:justify-center")}>
          <div className="min-w-0 lg:col-start-2 lg:row-start-1">{children}</div>
          {tubes && <BubbleTube voice="ocean" className="lg:col-start-1 lg:row-start-1" />}
          {tubes && <BubbleTube voice="rain" className="lg:col-start-3 lg:row-start-1" />}
        </div>
        {below}
      </div>
    </div>
  );
}
