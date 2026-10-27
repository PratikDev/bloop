"use client";

import { Slider } from "@/components/ui/slider";

/** A labelled time scrubber (month or rain frame) in the scenes' glass style. */
export function Scrubber({ label, valueText, index, count, onChange }: { label: string; valueText: string; index: number; count: number; onChange(i: number): void }) {
  return (
    <div className="grid grid-cols-[minmax(6rem,auto)_minmax(0,1fr)_minmax(7rem,auto)] items-center gap-3">
      <span className="text-small text-haze">{label}</span>
      <Slider
        min={0}
        max={Math.max(0, count - 1)}
        value={[index]}
        onValueChange={(v) => onChange(Array.isArray(v) ? v[0] : v)}
        thumbLabel={`${label}: ${valueText}`}
      />
      <span className="text-right text-body text-moon tabular-nums">{valueText}</span>
    </div>
  );
}
