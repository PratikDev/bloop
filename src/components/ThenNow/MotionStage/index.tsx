"use client";

import { useMemo, useState } from "react";
import { readPalette } from "@/lib/css-tokens";
import { CITY_POSITIONS } from "@/lib/places/bangladesh-cities";
import type { Beat } from "@/lib/then-now";
import type { ClimateCellName } from "@/types/data-contract";
import { useT } from "../../AppState/use-app-state";
import { useFrameImages } from "../../FrameView/use-frame-images";
import { GlobeStage } from "../../Globe/Stage";
import type { PauseMotion } from "../../SpaceWindow/use-pause-motion";
import { useHeld } from "./use-held";

/** The city on a globe beside the chart: its ring pulses on each beat, in the value's colour against the record's baseline. The year is on the chart. */
export function MotionStage({ city, beat, beatIndex, pause, className }: { city: ClimateCellName; beat: Beat | null; beatIndex: number | null; pause: PauseMotion; className?: string }) {
  const t = useT();
  const { sst } = useFrameImages();
  const images = useMemo(() => (sst ? [sst] : []), [sst]);
  const [palette] = useState(readPalette);
  const pulseKey = useHeld(beatIndex, pause.paused);
  const ringColor = beat?.value == null ? palette.shapla : beat.value >= beat.baseline ? palette.bubble : palette.dial;

  return (
    <GlobeStage
      images={images}
      focus={CITY_POSITIONS[city]}
      ringColor={ringColor}
      pulseKey={pulseKey ?? undefined}
      sentence={t("globe.centredOn", { place: t(`place.${city}`) })}
      pause={pause}
      className={className}
    />
  );
}
