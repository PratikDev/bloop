"use client";

import type { LightsStep } from "@/lib/earth/nightlights";
import { cn } from "@/lib/utils";

export function Timeline({ steps, current, label, range }: { steps: readonly LightsStep[]; current: number; label: string; range: { min: number; max: number } }) {
  const h = (r: number) => Math.max(0.06, Math.min(1, (Math.log10(r) - Math.log10(range.min)) / (Math.log10(range.max) - Math.log10(range.min))));
  return (
    <div role="img" aria-label={label} className="flex h-24 items-end gap-1 rounded-lg p-2 ring-1 ring-glass-edge" data-testid="lights-timeline">
      {steps.map((s, i) => (
        <span
          key={s.day}
          aria-hidden="true"
          data-gap={s.radiance === null ? "true" : "false"}
          className={cn(
            "flex-1 rounded-sm",
            s.radiance === null ? "h-full border border-dashed border-line bg-transparent" : "bg-amber",
            i === current && "ring-2 ring-moon ring-offset-1 ring-offset-night",
          )}
          style={s.radiance === null ? undefined : { height: `${h(s.radiance) * 100}%` }}
        />
      ))}
    </div>
  );
}
