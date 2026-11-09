"use client";

import type { CSSProperties, ReactNode } from "react";
import { usePlaceName } from "@/hooks/use-place-name";
import { cn } from "@/lib/utils";
import { useAppState, useT } from "../AppState/use-app-state";
import { useCommands } from "../Commands/use-commands";

// The longitude wraps at 180°, so the very end of the slider stops just short of it and the knob stays on the east side.
const EAST_EDGE = 179.99;

function Slider({
  label,
  min,
  max,
  value,
  valueText,
  low,
  high,
  className,
  onChange,
}: {
  className?: string;
  label: string;
  min: number;
  max: number;
  value: number;
  valueText: string;
  low: string;
  high: string;
  onChange: (value: number) => void;
}) {
  const fill = `${((value - min) / (max - min)) * 100}%`;
  return (
    <div className={cn("flex min-w-0 items-center gap-2 text-small text-haze", className)}>
      <span aria-hidden="true">{low}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        aria-label={label}
        aria-valuetext={valueText}
        onChange={(e) => onChange(Number(e.currentTarget.value))}
        style={{ "--fill": fill } as CSSProperties}
        className="needle-range min-w-0 flex-1"
      />
      <span aria-hidden="true">{high}</span>
    </div>
  );
}

/**
 * Move the needle without the map: West to east and South to north are real sliders, so phones with VoiceOver or
 * TalkBack can reach every place. They dispatch what the arrow keys do. `extra` joins the group (Go to).
 */
export function NeedleSliders({ extra }: { extra?: ReactNode }) {
  const { state } = useAppState();
  const commands = useCommands();
  const t = useT();
  const place = usePlaceName(state.cursor);
  const { lat, lon } = state.cursor;
  return (
    <div role="group" aria-label={t("needle.group")} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto]">
      <Slider
        className="col-span-2 md:col-span-1"
        label={t("needle.westEast")}
        min={-180}
        max={180}
        value={lon}
        valueText={t("needle.lonValue", { lon, place })}
        low={t("needle.w")}
        high={t("needle.e")}
        onChange={(next) => commands.setCursor({ lat, lon: Math.min(next, EAST_EDGE) })}
      />
      <Slider
        label={t("needle.southNorth")}
        min={-90}
        max={90}
        value={lat}
        valueText={t("needle.latValue", { lat, place })}
        low={t("needle.s")}
        high={t("needle.n")}
        onChange={(next) => commands.setCursor({ lat: next, lon })}
      />
      {extra}
    </div>
  );
}
