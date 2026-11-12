"use client";

import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SpaceWindow } from "../SpaceWindow";
import { PauseMotionKey } from "../SpaceWindow/PauseMotionKey";
import type { PauseMotion } from "../SpaceWindow/use-pause-motion";
import type { StarDensity } from "../Starfield/sky";
import { Globe, type GlobeProps } from ".";
import { useCornerFree } from "./use-corner-free";

/**
 * A globe in a space window with a small "Pause motion" key in the corner (in its own row under the globe when the
 * corner is too tight to stay clear of the disc, as on a nearly square phone stage) and one visually hidden
 * sentence saying what it shows (not a live region: it changes with the city, and captions carry the
 * rest). Nothing else goes on the globe: at most one overlay (`children`), and no captions or stats.
 */
export function GlobeStage({
  sentence,
  pause,
  density = "sparse",
  children,
  className,
  ...globe
}: Omit<GlobeProps, "paused" | "driftRef" | "className"> & {
  sentence: string;
  pause: PauseMotion;
  density?: StarDensity;
  /** The stage's one overlay. */
  children?: ReactNode;
  className?: string;
}) {
  const drift = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const corner = useCornerFree(stage);
  return (
    <SpaceWindow ref={stage} density={density} still={pause.paused} driftRef={drift} className={cn("flex min-h-0 flex-col", className)}>
      <p className="sr-only">{sentence}</p>
      <Globe {...globe} paused={pause.paused} driftRef={drift} className="min-h-0 flex-1" />
      {children}
      {corner ? (
        <PauseMotionKey pause={pause} compact className="absolute right-1 bottom-1" />
      ) : (
        <div className="flex justify-end px-1 pb-1">
          <PauseMotionKey pause={pause} compact />
        </div>
      )}
    </SpaceWindow>
  );
}
