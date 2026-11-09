import type { CSSProperties, RefObject } from "react";
import { cn } from "@/lib/utils";
import { buildSky, sparklePath, type Sky, type StarDensity } from "./sky";

const SKIES: Record<StarDensity, Sky> = { normal: buildSky("normal"), sparse: buildSky("sparse") };

function Tile({ sky }: { sky: Sky }) {
  return (
    <svg className="h-full w-1/2" xmlns="http://www.w3.org/2000/svg">
      {sky.stars.map((star, i) => (
        <circle
          key={i}
          cx={star.x}
          cy={star.y}
          r={star.radius}
          className={cn(star.warm ? "fill-star-warm" : "fill-star", star.twinkle && "star-twinkle")}
          style={star.twinkle ? ({ "--twinkle-duration": star.twinkle.duration, "--twinkle-delay": star.twinkle.delay } as CSSProperties) : undefined}
        />
      ))}
      {sky.sparkles.map((sparkle, i) => (
        <svg key={i} x={sparkle.x} y={sparkle.y} overflow="visible">
          <path d={sparklePath(sparkle.reach)} className="fill-star" />
        </svg>
      ))}
    </svg>
  );
}

/**
 * Flat stars that fill the parent, behind its content. Decorative. A few twinkle, unless `still` or
 * motion is reduced. `driftRef` receives the two-tile layer, for setStarDrift to shift as a globe turns.
 */
export function Starfield({ density = "normal", still = false, driftRef, className }: { density?: StarDensity; still?: boolean; driftRef?: RefObject<HTMLDivElement | null>; className?: string }) {
  const sky = SKIES[density];
  return (
    <div aria-hidden="true" data-still={still || undefined} className={cn("starfield pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div ref={driftRef} className="absolute inset-y-0 left-0 flex w-[200%]">
        <Tile sky={sky} />
        <Tile sky={sky} />
      </div>
    </div>
  );
}
