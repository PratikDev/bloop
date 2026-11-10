"use client";

import { useEffect, useState } from "react";

/**
 * A plain bar picture of a series (the picture-only clips): no numbers, no axis labels, so the eye gets what the ear
 * gets. With `animateMs`, a highlight walks along the bars at the sound's pace.
 */
export function Bars({ values, label, animateMs }: { values: readonly (number | null)[]; label: string; animateMs?: number }) {
  const [at, setAt] = useState(animateMs ? 0 : -1);
  useEffect(() => {
    if (!animateMs) return;
    const timer = setInterval(() => setAt((i) => (i + 1 < values.length ? i + 1 : i)), animateMs);
    return () => clearInterval(timer);
  }, [animateMs, values.length]);
  const present = values.filter((v): v is number => v !== null);
  const lo = Math.min(0, ...present);
  const hi = Math.max(...present, lo + 1e-9);
  const w = 100 / values.length;
  return (
    <svg viewBox="0 0 100 40" role="img" aria-label={label} className="h-32 w-full max-w-xl text-moon" data-testid="lt-bars">
      {values.map((v, i) =>
        v === null ? null : (
          <rect key={i} x={i * w + w * 0.1} width={w * 0.8} y={40 - ((v - lo) / (hi - lo)) * 38} height={((v - lo) / (hi - lo)) * 38}
            fill="currentColor" opacity={at === -1 || i === at ? 1 : 0.45} />
        ),
      )}
    </svg>
  );
}
