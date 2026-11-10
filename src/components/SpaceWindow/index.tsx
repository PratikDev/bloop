import type { ReactNode, Ref, RefObject } from "react";
import { cn } from "@/lib/utils";
import { Starfield } from "../Starfield";
import type { StarDensity } from "../Starfield/sky";

/**
 * A porthole onto the night sky: everywhere the app shows Earth as a planet. Text inside is paper
 * (night-sky re-points the tokens); a panel inside uses the on-space utility.
 */
export function SpaceWindow({
  ref,
  children,
  density,
  still,
  driftRef,
  className,
}: {
  ref?: Ref<HTMLDivElement>;
  children?: ReactNode;
  density?: StarDensity;
  still?: boolean;
  driftRef?: RefObject<HTMLDivElement | null>;
  className?: string;
}) {
  return (
    <div ref={ref} data-space className={cn("night-sky relative isolate overflow-hidden rounded-sheet border-3 border-navy", className)}>
      <Starfield density={density} still={still} driftRef={driftRef} className="-z-10" />
      {children}
    </div>
  );
}
