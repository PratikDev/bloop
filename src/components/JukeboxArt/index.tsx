import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Marquee } from "./Marquee";
import { Coin, Doors, Tubes, Unplugged, VIEW_H, VIEW_W, WINDOW } from "./parts";

const OUTLINE = "stroke-navy";
const BODY = "M30 580 V210 A190 190 0 0 1 410 210 V580 Z";
const ARCH = "M39.7 150 A190 190 0 0 1 400.3 150 Z";

/** Where the round window sits, as shares of the drawing: the place other content mounts over it. */
const windowStyle: CSSProperties = {
  left: `${((WINDOW.cx - WINDOW.r) / VIEW_W) * 100}%`,
  top: `${((WINDOW.cy - WINDOW.r) / VIEW_H) * 100}%`,
  width: `${((WINDOW.r * 2) / VIEW_W) * 100}%`,
};

/**
 * The closed jukebox, drawn in code: a coral arch with the marquee, bubble tubes on both sides, a round window, a coin
 * plate and a grille in two door groups (the journey into Listen opens them). Palette tokens only. Decorative.
 * `window` mounts over the round window, `tube` over the amber tube. `reactive` lets the marquee follow the sound.
 * `coin` draws the coin the journey drops. `unplugged` adds the pulled cord (the 404 page).
 */
export function JukeboxArt({
  marquee,
  window: windowContent,
  tube,
  reactive = false,
  coin = false,
  unplugged = false,
  className,
}: {
  marquee: string;
  window?: ReactNode;
  tube?: ReactNode;
  reactive?: boolean;
  coin?: boolean;
  unplugged?: boolean;
  className?: string;
}) {
  return (
    <div data-jukebox-art aria-hidden="true" className={cn("relative aspect-440/640", className)}>
      <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="absolute inset-0 size-full overflow-visible">
        <g data-body>
          <rect x="60" y="580" width="60" height="12" className="fill-navy" />
          <rect x="320" y="580" width="60" height="12" className="fill-navy" />
          <path d={BODY} transform="translate(10 10)" className="fill-navy" />
          <path d={BODY} strokeWidth="3" className={cn("fill-paper", OUTLINE)} />
          <Tubes />
          <circle cx={WINDOW.cx} cy={WINDOW.cy} r={WINDOW.r} strokeWidth="3" className={cn("fill-space", OUTLINE)} />
          <rect x="170" y="378" width="100" height="34" rx="6" strokeWidth="3" className={cn("fill-sea-deep", OUTLINE)} />
          <rect x="212" y="385" width="16" height="20" rx="3" className="fill-navy" />
          {coin && <Coin />}
        </g>
        <Doors />
        <g data-arch>
          <path d={ARCH} strokeWidth="3" className={cn("fill-coral", OUTLINE)} />
          <Marquee text={marquee} reactive={reactive} />
        </g>
        {unplugged && <Unplugged />}
      </svg>
      {tube}
      {windowContent && (
        <div style={windowStyle} className="absolute aspect-square overflow-hidden rounded-full">
          {windowContent}
        </div>
      )}
    </div>
  );
}
