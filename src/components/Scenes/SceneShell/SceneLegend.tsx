"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface LegendStop {
  at: number; // 0..1
  colour: string; // a data colour from the scene's colormap
}

export interface SceneLegendProps {
  title: string;
  minLabel: string;
  maxLabel: string;
  stops: readonly LegendStop[];
  /** Where the value under the needle sits (0..1); null = no value here. */
  marker: number | null;
  /** Reference ticks (0..1), e.g. zero on a diverging scale. */
  ticks?: readonly number[];
  /** A badge beside the title ("Zoomed axis", confidence). */
  badge?: ReactNode;
  className?: string;
}

/**
 * The Turntable's slim legend bar for a scene's own colour scale: the range,
 * reference ticks and a marker that glides to the value under the needle.
 * Visual only; the value itself is in the chip and spoken on Enter.
 */
export function SceneLegend({ title, minLabel, maxLabel, stops, marker, ticks = [], badge, className }: SceneLegendProps) {
  // Data colours (the scene's colormap), so they are inline, not theme tokens.
  const gradient = `linear-gradient(to right, ${stops.map((s) => `${s.colour} ${s.at * 100}%`).join(", ")})`;
  return (
    <div className={cn("glass-chip rounded-2xl px-4 py-2", className)}>
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3">
        <span className="text-body text-haze tabular-nums">{minLabel}</span>
        <div aria-hidden="true" className="relative h-2 rounded-full" style={{ backgroundImage: gradient }}>
          {ticks.map((v) => (
            <span key={v} className="absolute -top-0.5 h-3 w-px bg-moon" style={{ left: `${v * 100}%` }} />
          ))}
          {marker !== null && (
            <span
              className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-moon bg-tt-black transition-[left] duration-300 ease-out motion-reduce:transition-none"
              style={{ left: `${Math.min(1, Math.max(0, marker)) * 100}%` }}
            />
          )}
        </div>
        <span className="text-body text-haze tabular-nums">{maxLabel}</span>
        <span className="col-span-3 mt-1 flex items-center justify-center gap-2 text-small text-haze">
          <span className="truncate">{title}</span>
          {badge}
        </span>
      </div>
    </div>
  );
}

/** A small outlined badge ("Zoomed axis", "Agreement: high"). */
export function SceneBadge({ children }: { children: ReactNode }) {
  return <span className="shrink-0 rounded-full border border-amber px-2 text-small font-semibold text-amber">{children}</span>;
}
