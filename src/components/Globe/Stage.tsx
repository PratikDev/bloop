"use client";

import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SpaceWindow } from "../SpaceWindow";
import { PauseMotionKey } from "../SpaceWindow/PauseMotionKey";
import type { PauseMotion } from "../SpaceWindow/use-pause-motion";
import type { StarDensity } from "../Starfield/sky";
import { Globe, type GlobeProps } from ".";

/**
 * A globe in a space window with its "Pause motion" key and one visually hidden sentence saying
 * what it shows (not a live region: it changes with the city, and captions carry the rest).
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
  /** Anything else on the stage (the year, a toggle). */
  children?: ReactNode;
  className?: string;
}) {
  const drift = useRef<HTMLDivElement>(null);
  return (
    <SpaceWindow density={density} still={pause.paused} driftRef={drift} className={cn("min-h-0", className)}>
      <p className="sr-only">{sentence}</p>
      <Globe {...globe} paused={pause.paused} driftRef={drift} />
      {children}
      <PauseMotionKey pause={pause} className="absolute right-2 bottom-2" />
    </SpaceWindow>
  );
}
