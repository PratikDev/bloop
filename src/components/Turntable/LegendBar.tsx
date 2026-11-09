"use client";

import { frameScale, scaleShare as share, type FrameScale as Scale } from "@/lib/frame-scale";
import { formatInteger, formatRainRate } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useAppState, useT } from "../AppState/use-app-state";
import { useLiveData } from "../LiveData/use-live-data";
import { useShownPoint } from "../TimeLapse/use-shown-point";
import { useTT } from "./i18n";
import { recordFrames } from "./records";

/**
 * A horizontal tube per frame, filled to the value under the needle on the frame's own range, with
 * ticks at mapping.json's legend values. Visual only: the value is spoken on Enter.
 */
export function LegendBar({ className }: { className?: string }) {
  const { state } = useAppState();
  const { fields } = useLiveData();
  const t = useT();
  const { tt } = useTT();
  const { reading, track } = useShownPoint();
  if (!reading) return null;
  const fmt = (s: Scale, v: number) => (s.log ? formatRainRate(v, state.lang) : formatInteger(v, state.lang));
  const scales = recordFrames(track, fields).map((f) => frameScale(f, f.product === "ocean" ? reading.ocean.valueC : reading.rain.mmPerHour));

  return (
    <div aria-hidden="true" className={cn("on-space space-y-2 rounded-plate px-4 py-2", className)}>
      {scales.map((s) => (
        <div key={s.title} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3">
          <span className="text-body text-haze tabular-nums">{fmt(s, s.min)}</span>
          <div className="relative h-4 overflow-hidden rounded-full border-2 border-line bg-paper">
            {s.value !== null && (
              <div className={cn("absolute inset-0 origin-left transition-transform duration-300 ease-out motion-reduce:transition-none", s.fill)} style={{ transform: `scaleX(${share(s, s.value)})` }} />
            )}
            {s.ticks.map((v) => (
              <span key={v} className="absolute inset-y-0 w-px bg-line" style={{ left: `${share(s, v) * 100}%` }} />
            ))}
          </div>
          <span className="text-body text-haze tabular-nums">
            {fmt(s, s.max)} {t(s.unit)}
          </span>
          <span className="col-span-3 hidden text-center text-small text-haze sm:block">{tt(s.title)}</span>
        </div>
      ))}
    </div>
  );
}
