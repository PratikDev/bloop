"use client";

import type { CSSProperties } from "react";
import type { LatLon } from "@/lib/data";
import { valueAt } from "@/lib/data";
import { frameScale, scaleShare } from "@/lib/frame-scale";
import { useAppState } from "../AppState/use-app-state";
import { TubeBubbles } from "../Cabinet/TubeBubbles";
import { useLiveData } from "../LiveData/use-live-data";
import { recordFrames } from "../Turntable/records";
import { AMBER_TUBE, VIEW_H, VIEW_W } from "./parts";

const BUBBLES_PER_SECOND = 2;

const place: CSSProperties = {
  left: `${(AMBER_TUBE.x / VIEW_W) * 100}%`,
  top: `${(AMBER_TUBE.y / VIEW_H) * 100}%`,
  width: `${(AMBER_TUBE.width / VIEW_W) * 100}%`,
  height: `${(AMBER_TUBE.height / VIEW_H) * 100}%`,
};

/**
 * Home's amber tube: filled to the real ocean temperature at the point the globe faces, on the frame's own scale.
 * Over land or no data (or with no point yet) it drains to empty, with no bubbles. Decorative: the art is aria-hidden.
 */
export function DataTube({ facing, paused = false }: { facing: LatLon | null; paused?: boolean }) {
  const { state } = useAppState();
  const { fields } = useLiveData();
  const value = fields && facing ? valueAt(fields, "ocean", facing.lat, facing.lon).valueC : null;
  const frame = recordFrames("ocean", fields)[0];
  const scale = frame ? frameScale(frame, value) : null;
  const level = scale && scale.value !== null ? scaleShare(scale, scale.value) : 0;
  return (
    <div style={place} className="absolute overflow-hidden rounded-full bg-paper">
      <div
        style={{ "--level": level } as CSSProperties}
        className="absolute inset-0 origin-bottom scale-y-(--level) bg-bubble transition-[scale] duration-(--duration-flip) ease-out motion-reduce:transition-none"
      />
      <TubeBubbles level={level} speed={level} perSecond={value === null ? 0 : BUBBLES_PER_SECOND} running={!paused && !state.reduceMotion && value !== null} />
    </div>
  );
}
