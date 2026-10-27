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
 * A range bar per frame with a marker at the needle's value, and the actual
 * frame pixel colour under the needle (no reconstructed colormap: NASA's
 * colorbar data isn't published yet). Visual only; the value is spoken on Enter.
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
    <div aria-hidden="true" className={cn("space-y-3", className)}>
      {scales.map((s) => (
        <div key={s.title} className="space-y-1">
          <p className="text-body text-moon">
            {tt(s.title)} ({t(s.unit)})
          </p>
          <div className="relative h-3 rounded-full border border-haze bg-tide">
            {s.ticks.map((v) => (
              <span key={v} className="absolute top-0 h-full w-px bg-haze" style={{ left: `${position(s, v)}%` }} />
            ))}
            {s.value !== null && (
              <span
                className="absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-moon bg-ink"
                style={{ left: `${position(s, s.value)}%` }}
                title={tt("turntable.legend.marker")}
              />
            )}
          </div>
          <div className="relative h-6 text-body text-haze">
            {[s.min, ...s.ticks, s.max].map((v, i, all) => (
              <span
                key={`${v}-${i}`}
                className={cn("absolute", i === 0 ? "" : i === all.length - 1 ? "-translate-x-full" : "-translate-x-1/2")}
                style={{ left: `${position(s, v)}%` }}
              >
                {fmt(s, v)}
              </span>
            ))}
          </div>
        </div>
      ))}
      <p className="flex items-center gap-2 text-body text-moon">
        <span className={cn("inline-block size-6 rounded-sm border border-haze", !swatch && "hatch")} style={swatch} />
        {swatch ? tt("turntable.legend.pixel") : tt("turntable.legend.noValue")}
      </p>
    </div>
  );
}
