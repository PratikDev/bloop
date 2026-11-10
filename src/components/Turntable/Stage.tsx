"use client";

import dynamic from "next/dynamic";
import { useEffect, useId, useRef, type KeyboardEvent, type RefObject } from "react";
import { cn } from "@/lib/utils";
import type { LatLon } from "@/lib/data";
import { useAppState } from "../AppState/use-app-state";
import { DeckViewCanvas } from "./DeckView";
import type { DeckControls } from "./DeckView/use-deck-hardware";
import { PreviewMarker } from "./PreviewMarker";
import { latText, useTT } from "./i18n";
import type { LabelCandidate } from "./labels";
import { LabelLayer, type GraticuleLabel, type PlacedLabels, type Rect } from "./LabelLayer";
import { LoadingPanel } from "./LoadingPanel";
import { NeedleChip } from "./NeedleChip";
import type { Details } from "./NeedleChip/use-details";
import type { SentReading } from "./needle-sound";
import type { Tier } from "./quality";
import type { IntroPhase } from "./use-intro";
import type { Geo } from "./use-geo";
import { useGlobePointer, wheelZoom } from "./use-globe-pointer";
import { useOccluderFit } from "./use-occluder-fit";
import { useSoundRings } from "./use-sound-rings";
import type { Turntable } from "./use-turntable";

// The 3D view (R3F, postprocessing): its own chunk.
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
  /** The point previewed under the pointer, and its place line (null: none). */
  preview: { at: LatLon; place: string | null } | null;
  /** null = names hidden (Layers). */
  labels: LabelCandidate[] | null;
  graticule: GraticuleLabel[] | null;
  details: Details;
  intro: IntroPhase;
  ready: boolean;
  /** Where the readout stays. */
  chipDock: HTMLElement | null;
  onKeyDown(e: KeyboardEvent<HTMLElement>): void;
  debug: { sendLog: RefObject<SentReading[]>; placed: { current: PlacedLabels } } | null;
  /** The bar's own actions and state, which the turntable's hardware mirrors. */
  deckControls: DeckControls;
  className?: string;
}

/** The globe and everything drawn over it; the focusable region for the Turntable keys. */
export function Stage({ tt, hostRef, geo, record, tier, place, preview, labels, graticule, details, intro, ready, chipDock, onKeyDown, debug, deckControls, className }: StageProps) {
  const { tt: tr, lang } = useTT();
  const { state } = useAppState();
  const pointer = useGlobePointer(tt);
  const instructionsId = useId();
  const recordId = useId();
  const reserved = useRef<Rect[]>([]);
  useOccluderFit(tt.scene, hostRef);
  useSoundRings(tt.sceneRef);

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
      data-overlay
      role="application"
      tabIndex={0}
      aria-roledescription={tr("turntable.roleDescription")}
      aria-label={tr("turntable.region", { record })}
      aria-describedby={`${instructionsId} ${recordId}`}
      onKeyDown={onKeyDown}
      className={cn("relative overflow-hidden bg-studio-bottom", className)}
    >
      <p id={instructionsId} className="sr-only">
        {tr("turntable.instructions")}
      </p>
      {/* The record in words: follows the settled cursor, so it changes when the needle settles. Not a live region. */}
      <p id={recordId} className="sr-only">
        {tr("turntable.record.description", { lat: latText(state.cursor.lat, lang) })}
      </p>
      <div ref={hostRef} {...pointer} className="absolute inset-0 touch-none select-none">
        <TurntableCanvas dataCanvas={tt.texture.canvas} tier={tier} label={tr("turntable.canvas", { record })} onReady={tt.onSceneReady} />
      </div>
      {/* The turntable beside the globe (under it on narrow screens): placed by use-occluder-fit. Not a panel. */}
      <div data-deck-host className="absolute top-0 left-0 transition-transform duration-(--duration-flip) ease-(--ease-mechanical) motion-reduce:transition-none">
        <DeckViewCanvas tt={tt} controls={deckControls} />
      </div>
      {labels && <LabelLayer subscribe={tt.subscribe} candidates={labels} graticule={graticule} reserved={reserved} placedRef={debug?.placed} />}
      <NeedleChip subscribe={tt.subscribe} place={place} preview={preview} details={details} reserved={reserved} dock={chipDock} />
      <PreviewMarker subscribe={tt.subscribe} at={preview?.at ?? null} />
      {intro !== "done" && <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 bg-tt-black", intro === "running" && "animate-intro-fade")} />}
      {!ready && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid place-items-center">
          <LoadingPanel />
        </div>
      )}
      {ready && intro === "running" && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-6 grid place-items-center">
          <p data-tt-occluder className="label-halo text-body">{tr("turntable.intro.skip")}</p>
        </div>
      )}
      {debug && <DebugOverlay tt={tt} sendLog={debug.sendLog} placed={debug.placed} geo={geo} />}
    </div>
  );
}
