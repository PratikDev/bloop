"use client";

import type { CSSProperties } from "react";
import { usePlaceName } from "@/hooks/use-place-name";
import { cn } from "@/lib/utils";
import { useAppState, useT } from "../AppState/use-app-state";
import { useCommands } from "../Commands/use-commands";

// The longitude wraps at 180°, so the very end of the slider stops just short of it and the knob stays on the east side.
const EAST_EDGE = 179.99;
const RANGE = { lon: [-180, 180], lat: [-90, 90] } as const;

/**
 * Move the needle without the map: real sliders, so phones with VoiceOver or TalkBack can reach every place.
 * They dispatch what the arrow keys do. West to east sits on the bar; South to north in More, with Go to.
 */
export function NeedleSlider({ axis, className }: { axis: "lon" | "lat"; className?: string }) {
  const { state } = useAppState();
  const commands = useCommands();
  const t = useT();
  const place = usePlaceName(state.cursor);
  const { lat, lon } = state.cursor;
  const lonAxis = axis === "lon";
  const value = lonAxis ? lon : lat;
  const [min, max] = RANGE[axis];
  return (
    <div className={cn("flex min-w-0 items-center gap-2 text-small text-haze", className)}>
      <span aria-hidden="true">{t(lonAxis ? "needle.w" : "needle.s")}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        aria-label={t(lonAxis ? "needle.westEast" : "needle.southNorth")}
        aria-valuetext={lonAxis ? t("needle.lonValue", { lon, place }) : t("needle.latValue", { lat, place })}
        onChange={(e) => {
          const next = Number(e.currentTarget.value);
          commands.setCursor(lonAxis ? { lat, lon: Math.min(next, EAST_EDGE) } : { lat: next, lon });
        }}
        style={{ "--fill": `${((value - min) / (max - min)) * 100}%` } as CSSProperties}
        className="needle-range min-w-0 flex-1"
      />
      <span aria-hidden="true">{t(lonAxis ? "needle.e" : "needle.n")}</span>
    </div>
  );
}
