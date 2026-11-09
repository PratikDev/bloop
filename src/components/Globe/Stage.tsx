"use client";

import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SpaceWindow } from "../SpaceWindow";
import { PauseMotionKey } from "../SpaceWindow/PauseMotionKey";
import type { PauseMotion } from "../SpaceWindow/use-pause-motion";
import type { StarDensity } from "../Starfield/sky";
import { Globe, type GlobeProps } from ".";

/**
 * A globe in a space window with a small "Pause motion" key in the corner and one visually hidden
 * sentence saying what it shows (not a live region: it changes with the city, and captions carry the
 * rest). Nothing else goes on the globe: at most one overlay (`children`), and no captions or stats.
 */
export function GlobeStage({
  sentence,
  pause,
  density = "sparse",
  keyBelow = false,
  children,
  className,
  ...globe
}: Omit<GlobeProps, "paused" | "driftRef" | "className"> & {
  sentence: string;
  pause: PauseMotion;
  density?: StarDensity;
  /** A narrow stage has no free corner beside the disc: the key gets its own row under it. */
  keyBelow?: boolean;
  /** The stage's one overlay. */
  children?: ReactNode;
  className?: string;
}) {
  const drift = useRef<HTMLDivElement>(null);
  return (
    <SpaceWindow density={density} still={pause.paused} driftRef={drift} className={cn("flex min-h-0 flex-col", className)}>
      <p className="sr-only">{sentence}</p>
      <Globe {...globe} paused={pause.paused} driftRef={drift} className="min-h-0 flex-1" />
      {children}
      {keyBelow ? (
        <div className="flex justify-end p-2">
          <PauseMotionKey pause={pause} />
        </div>
      ) : (
        <PauseMotionKey pause={pause} className="absolute right-2 bottom-2" />
      )}
    </SpaceWindow>
  );
}
