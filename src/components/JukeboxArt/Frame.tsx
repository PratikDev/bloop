"use client";

import { useRef, type ReactNode } from "react";
import { useWordmarkWidth } from "@/hooks/use-wordmark-width";
import { cn } from "@/lib/utils";

/** "front": everything but the arch; "arch": only the arch and the coin (the journey moves them apart). */
type Layer = "all" | "front" | "arch";

function ArchCap({ marquee, reactive }: { marquee: string; reactive: boolean }) {
  const text = useRef<HTMLParagraphElement>(null);
  useWordmarkWidth(text, reactive);
  return (
    <>
      <div data-cap aria-hidden="true" className="jukebox-cap absolute inset-x-0 top-0 border-b-3 border-navy bg-coral" />
      <p ref={text} data-marquee aria-hidden="true" translate="no" className="relative z-1 h-12 pt-2 text-center font-wide text-[2.5rem] leading-10">
        {marquee}
      </p>
    </>
  );
}

/**
 * Home's jukebox, built around the globe: the window is the centrepiece (`--jf-window` sets its size), the coral arch
 * rises behind its top edge with the marquee above it, a tube sits on each side, and a slim coin plate below.
 * The frame never covers the disc. `tube` is the live amber tube, `footer` sits on the plate's row.
 */
export function JukeboxFrame({
  marquee,
  window: windowContent,
  tube,
  footer,
  reactive = false,
  layer = "all",
  className,
}: {
  marquee: string;
  window?: ReactNode;
  tube?: ReactNode;
  footer?: ReactNode;
  reactive?: boolean;
  layer?: Layer;
  className?: string;
}) {
  const front = layer !== "arch";
  const arch = layer !== "front";
  const tubeClass = "jukebox-tube relative overflow-hidden rounded-full border-3 border-navy";
  return (
    <div data-jukebox-art className={cn("jukebox-frame relative flex flex-col items-center overflow-hidden", layer === "arch" && "border-transparent! bg-transparent! shadow-none!", className)}>
      {arch ? <ArchCap marquee={marquee} reactive={reactive} /> : <div aria-hidden="true" className="h-12" />}
      {front ? (
        <>
          <div className="jukebox-window relative z-1 overflow-hidden rounded-full border-3 border-navy bg-space">{windowContent}</div>
          <div aria-hidden="true" className="jukebox-tubes flex gap-4">
            <div className={cn(tubeClass, "bg-bubble")}>{tube}</div>
            <div className={cn(tubeClass, "bg-dial")} />
          </div>
          <div className="relative z-1 flex min-h-11 flex-wrap items-center justify-center gap-x-3 gap-y-2 px-4 pb-3">
            <span aria-hidden="true" className="grid h-7 w-14 shrink-0 place-items-center rounded-md border-3 border-navy bg-sea-deep">
              <span className="block h-4 w-2 rounded-xs bg-navy" />
            </span>
            {footer}
          </div>
        </>
      ) : (
        <span data-coin aria-hidden="true" className="jukebox-coin absolute left-1/2 z-2 size-6 -translate-x-1/2 rounded-full border-3 border-navy bg-bubble" />
      )}
    </div>
  );
}
