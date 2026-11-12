"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useArrowHeld } from "./use-arrow-held";

/**
 * A settled value that rolls digit by digit when it changes (160 ms; a cut under reduced motion or
 * while an arrow key is held). Decorative: whoever shows it gives the value to assistive tech as text.
 * `value` is already formatted, so Bangla digits and units pass through untouched.
 */
export function Odometer({ value, className }: { value: string; className?: string }) {
  useArrowHeld();
  const [shown, setShown] = useState({ value, previous: value, roll: 0 });
  if (shown.value !== value) setShown({ value, previous: shown.value, roll: shown.roll + 1 });

  const chars = [...value];
  const before = [...shown.previous];
  // Digits line up from the right, so 99 → 100 only rolls what changed.
  const beforeAt = (i: number) => before[before.length - chars.length + i];

  return (
    <span aria-hidden="true" className={cn("inline-flex", className)}>
      {chars.map((char, i) => {
        const old = beforeAt(i);
        const rolling = old !== undefined && old !== char;
        return (
          <span key={chars.length - i} className="odometer-cell">
            {rolling ? (
              <span key={shown.roll} className="odometer-roll">
                <span>{old}</span>
                <span>{char}</span>
              </span>
            ) : (
              char
            )}
          </span>
        );
      })}
    </span>
  );
}
