"use client";

import type { CSSProperties } from "react";
import { frameScale, scaleShare } from "@/lib/frame-scale";
import { formatInteger, formatRainRate, formatTemperature } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { liveSoundOn } from "../AppState/reducer";
import { useAppState, useT } from "../AppState/use-app-state";
import { useLiveData } from "../LiveData/use-live-data";
import { useShownPoint } from "../TimeLapse/use-shown-point";
import { recordFrames } from "../Turntable/records";
import { TubeBubbles } from "./TubeBubbles";

/** Ocean bubbles come at a steady rate (their speed carries the value); rain bubbles come faster the heavier the rain. */
const OCEAN_PER_SECOND = 2;
const RAIN_MAX_PER_SECOND = 3;

/**
 * A tube filled to the value under the needle, on this frame's own scale (the same reading the Readout uses).
 * It carries the level; the number is the Readout's. A tube whose voice isn't playing keeps its place, unseen.
 * Standing beside the map (from 1280 px), bubbles rise in it while the sound plays (motion item 4): the ocean's rise
 * faster the warmer it is; the rain's come more often the heavier the rain (on its log scale), and none when dry.
 */
export function BubbleTube({ voice, className }: { voice: "ocean" | "rain"; className?: string }) {
  const { state } = useAppState();
  const { fields } = useLiveData();
  const { reading, track } = useShownPoint();
  const t = useT();
  const heard = track === "both" || track === voice;
  const frame = recordFrames("both", fields).find((f) => f.product === voice);
  const value = !reading ? null : voice === "ocean" ? reading.ocean.valueC : reading.rain.mmPerHour;
  const scale = frame ? frameScale(frame, value) : null;
  const level = scale && scale.value !== null ? scaleShare(scale, scale.value) : 0;
  const wet = scale !== null && scale.value !== null;
  const perSecond = !wet ? 0 : voice === "ocean" ? OCEAN_PER_SECOND : RAIN_MAX_PER_SECOND * level;
  const bubbling = heard && wet && liveSoundOn(state) && !state.reduceMotion;

  const label = () => {
    if (!scale || scale.value === null) return t(voice === "ocean" ? "tube.ocean.none" : "tube.rain.none");
    const { lang } = state;
    return voice === "ocean"
      ? t("tube.ocean", { value: formatTemperature(scale.value, lang), min: formatInteger(scale.min, lang), max: formatInteger(scale.max, lang) })
      : t("tube.rain", { value: formatRainRate(scale.value, lang), min: formatRainRate(scale.min, lang), max: formatRainRate(scale.max, lang) });
  };

  return (
    <div role="img" aria-label={label()} className={cn("relative h-5 overflow-hidden rounded-full border-(length:--outline) border-navy bg-paper xl:h-auto xl:w-5", !heard && "invisible", className)}>
      <div
        data-tube-fill
        style={{ "--level": level } as CSSProperties}
        className={cn(
          "absolute inset-0 origin-left scale-x-(--level) transition-[scale] duration-(--duration-flip) ease-out motion-reduce:transition-none xl:origin-bottom xl:scale-x-100 xl:scale-y-(--level)",
          voice === "ocean" ? "bg-bubble" : "bg-dial",
        )}
      />
      <div className="hidden xl:contents">
        <TubeBubbles level={level} speed={voice === "ocean" ? level : 0.5} perSecond={perSecond} running={bubbling} />
      </div>
    </div>
  );
}
