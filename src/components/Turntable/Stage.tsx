"use client";

import dynamic from "next/dynamic";
import { Search } from "lucide-react";
import { useEffect, useId, useRef, type KeyboardEvent, type RefObject } from "react";
import { cn } from "@/lib/utils";
import { useTT } from "./i18n";
import type { LabelCandidate } from "./labels";
import { LabelLayer, type GraticuleLabel, type PlacedLabels, type Rect } from "./LabelLayer";
import { NeedleChip } from "./NeedleChip";
import type { Details } from "./NeedleChip/use-details";
import type { SentReading } from "./needle-sound";
import type { Tier } from "./quality";
import type { IntroPhase } from "./use-intro";
import type { Geo } from "./use-geo";
import { useGlobePointer, wheelZoom } from "./use-globe-pointer";
import type { Turntable } from "./use-turntable";

// The 3D view (R3F, drei, postprocessing, takram): its own chunk.
const TurntableCanvas = dynamic(() => import("./TurntableCanvas").then((m) => m.TurntableCanvas), { ssr: false });
// Developer overlay (?debug=1): its own chunk, never loaded otherwise.
const DebugOverlay = dynamic(() => import("./DebugOverlay").then((m) => m.DebugOverlay), { ssr: false });

export interface StageProps {
  tt: Turntable;
  hostRef: RefObject<HTMLDivElement | null>;
  geo: Geo | null;
  record: string;
  tier: Tier | null;
  place: string | null;
  /** null = names hidden (Layers). */
  labels: LabelCandidate[] | null;
  graticule: GraticuleLabel[] | null;
  details: Details;
  intro: IntroPhase;
  idle: boolean;
  onKeyDown(e: KeyboardEvent<HTMLElement>): void;
  debug: { sendLog: RefObject<SentReading[]>; placed: { current: PlacedLabels } } | null;
  className?: string;
}

/** The globe and everything drawn over it; the focusable region for the Turntable keys. */
export function Stage({ tt, hostRef, geo, record, tier, place, labels, graticule, details, intro, idle, onKeyDown, debug, className }: StageProps) {
  const { tt: tr } = useTT();
  const pointer = useGlobePointer(tt);
  const instructionsId = useId();
  const reserved = useRef<Rect[]>([]);

  // Wheel zoom without scrolling the page (React's wheel listeners are passive).
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      wheelZoom(tt, e);
    };
    host.addEventListener("wheel", onWheel, { passive: false });
    return () => host.removeEventListener("wheel", onWheel);
  }, [hostRef, tt]);

  return (
    <div
      role="application"
      tabIndex={0}
      aria-roledescription={tr("turntable.roleDescription")}
      aria-label={tr("turntable.region", { record })}
      aria-describedby={instructionsId}
      onKeyDown={onKeyDown}
      className={cn("relative overflow-hidden bg-studio-bottom", className)}
    >
      <p id={instructionsId} className="sr-only">
        {tr("turntable.instructions")}
      </p>
      <div ref={hostRef} {...pointer} className="absolute inset-0 touch-none select-none">
        <TurntableCanvas dataCanvas={tt.texture.canvas} tier={tier} label={tr("turntable.canvas", { record })} onReady={tt.onSceneReady} />
      </div>
      {labels && <LabelLayer subscribe={tt.subscribe} candidates={labels} graticule={graticule} reserved={reserved} placedRef={debug?.placed} />}
      <NeedleChip subscribe={tt.subscribe} place={place} details={details} reserved={reserved} />
      <p className="pointer-events-none absolute top-3 left-4 max-w-[60%] text-small text-haze">{tr("turntable.background")}</p>
      {idle && intro === "done" && (
        <p className="glass-chip pointer-events-none absolute top-16 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full px-4 py-2 text-body text-moon">
          <Search aria-hidden="true" className="size-4" />
          {tr("turntable.idleHint")}
        </p>
      )}
      {intro !== "done" && (
        <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 grid place-items-center bg-tt-black", intro === "running" && "animate-intro-fade")}>
          <p className="text-body text-haze">{tr("turntable.intro.skip")}</p>
        </div>
      )}
      {debug && <DebugOverlay tt={tt} sendLog={debug.sendLog} placed={debug.placed} geo={geo} />}
    </div>
  );
}
