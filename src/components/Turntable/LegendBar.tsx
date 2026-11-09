"use client";

import type { CSSProperties } from "react";
import { normalise, voiceSpec } from "@/lib/audio/mapping";
import { formatInteger, formatRainRate } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useAppState, useT } from "../AppState/use-app-state";
import { useLiveData } from "../LiveData/use-live-data";
import { useShownPoint } from "../TimeLapse/use-shown-point";
import { useTT } from "./i18n";
import { recordFrames, type RecordFrame } from "./records";

interface Scale {
  title: "turntable.legend.ocean" | "turntable.legend.rain";
  min: number;
  max: number;
  log: boolean;
  unit: "unit.celsius" | "unit.mmPerHour";
  ticks: number[];
  value: number | null;
}

/** The frame's own range (value_range in its JSON), ticks at mapping.json's legend values. */
function scaleFor(frame: RecordFrame, value: number | null): Scale {
  const [min, max] = frame.meta.value_range;
  const voice = frame.product === "ocean" ? "ocean" : "rain";
  const ticks = voiceSpec(voice).legend.map((p) => p.value).filter((v) => v >= min && v <= max);
  return frame.product === "ocean"
    ? { title: "turntable.legend.ocean", min, max, log: false, unit: "unit.celsius", ticks, value }
    : { title: "turntable.legend.rain", min, max, log: true, unit: "unit.mmPerHour", ticks, value: value && value > 0 ? value : null };
}

const position = (s: Scale, v: number) => (normalise(v, { min: s.min, max: s.max, scale: s.log ? "log" : "linear" }) ?? 0) * 100;

/**
 * A slim, translucent range bar per frame along the bottom edge: the frame's
 * own range, ticks at mapping.json's legend values, and a marker that glides
 * to the needle's value, filled with the actual frame pixel under the needle
 * (no reconstructed colormap: NASA's colorbar data isn't published yet).
 * Visual only; the value is spoken on Enter.
 */
export function LegendBar({ pixel, className }: { pixel: [number, number, number] | null; className?: string }) {
  const { state } = useAppState();
  const { fields } = useLiveData();
  const t = useT();
  const { tt } = useTT();
  const { reading, track } = useShownPoint();
  if (!reading) return null;
  const fmt = (s: Scale, v: number) => (s.log ? formatRainRate(v, state.lang) : formatInteger(v, state.lang));
  const scales = recordFrames(track, fields).map((f) => scaleFor(f, f.product === "ocean" ? reading.ocean.valueC : reading.rain.mmPerHour));
  const swatch: CSSProperties | undefined = pixel ? { backgroundColor: `rgb(${pixel.join(" ")})` } : undefined;

  return (
    <div aria-hidden="true" className={cn("glass-chip space-y-2 rounded-2xl px-4 py-2", className)}>
      {scales.map((s) => (
        <div key={s.title} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3">
          <span className="text-body text-haze tabular-nums">{fmt(s, s.min)}</span>
          <div className="relative h-1.5 rounded-full bg-line">
            {s.ticks.map((v) => (
              <span key={v} className="absolute -top-0.5 h-2.5 w-px bg-haze" style={{ left: `${position(s, v)}%` }} />
            ))}
            {s.value !== null && (
              <span
                className={cn(
                  "absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-moon transition-[left] duration-300 ease-out motion-reduce:transition-none",
                  !swatch && "hatch",
                )}
                style={{ left: `${position(s, s.value)}%`, ...swatch }}
                title={tt("turntable.legend.marker")}
              />
            )}
          </div>
          <span className="text-body text-haze tabular-nums">
            {fmt(s, s.max)} {t(s.unit)}
          </span>
          <span className="col-span-3 hidden truncate text-center text-small text-haze sm:block">{tt(s.title)}</span>
        </div>
      ))}
    </div>
  );
}
