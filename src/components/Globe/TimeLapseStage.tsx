"use client";

import { useMemo, useState } from "react";
import { useAppState, useT } from "../AppState/use-app-state";
import { ChoiceGroup } from "../ChoiceGroup";
import { useFrameImages } from "../FrameView/use-frame-images";
import { usePauseMotion } from "../SpaceWindow/use-pause-motion";
import { useTimeLapse } from "../TimeLapse/use-time-lapse";
import { GlobeStage } from "./Stage";
import { supportsWebGL } from "./use-globe";

type View = "globe" | "flat";

/**
 * Over the map window while the storm time-lapse runs: each frame on a globe that eases to the
 * heaviest rain, the ring pulsing once per frame. Frames cut; the flat map stays underneath for
 * "Flat map". Without WebGL or with reduced motion the flat map is all there is.
 */
export function TimeLapseStage() {
  const { state, dispatch } = useAppState();
  const t = useT();
  const { status, current } = useTimeLapse();
  const { sst } = useFrameImages();
  const pause = usePauseMotion();
  const [webgl] = useState(supportsWebGL);
  const frame = current?.image ?? null;
  const images = useMemo(() => (sst && frame ? [sst, frame] : []), [sst, frame]);

  if (status !== "playing" || !current || !webgl || state.reduceMotion) return null;
  const view: View = state.timeLapseGlobe ? "globe" : "flat";

  return (
    <>
      {view === "globe" && (
        <GlobeStage
          images={images}
          focus={{ lat: current.point.lat, lon: current.point.lon }}
          pulseKey={current.index}
          sentence={t("globe.following")}
          pause={pause}
          className="absolute inset-0 z-(--layer-map-plates) rounded-none border-0"
        />
      )}
      <div className="on-space absolute top-2 right-2 z-(--layer-map-plates) rounded-lg p-1">
        <ChoiceGroup<View>
          label={t("timelapse.view")}
          value={view}
          onChange={(next) => {
            if ((next === "globe") !== state.timeLapseGlobe) dispatch({ type: "toggle", key: "timeLapseGlobe" });
          }}
          options={[
            { value: "globe", label: t("timelapse.view.globe") },
            { value: "flat", label: t("timelapse.view.flat") },
          ]}
        />
      </div>
    </>
  );
}
