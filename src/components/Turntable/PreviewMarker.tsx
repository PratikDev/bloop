"use client";

import { useEffect, useRef } from "react";
import type { LatLon } from "@/lib/data";
import type { Turntable } from "./use-turntable";

/** Half the marker's size (it's 24 px across). */
const HALF_PX = 12;

/**
 * A faint outline at the point being previewed on the globe: no fill colour until it's selected. Placed on the globe's
 * frame; hidden when the point turns away. Decorative: the readout carries the preview.
 */
export function PreviewMarker({ subscribe, at }: { subscribe: Turntable["subscribe"]; at: LatLon | null }) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!at) {
      el.style.opacity = "0";
      return;
    }
    return subscribe((f) => {
      const p = f.project(at.lat, at.lon);
      el.style.opacity = p.facing > 0 ? "1" : "0";
      el.style.transform = `translate(${Math.round(p.x - HALF_PX)}px, ${Math.round(p.y - HALF_PX)}px)`;
    });
  }, [subscribe, at]);
  return (
    <svg ref={ref} aria-hidden="true" viewBox="0 0 24 24" className="pointer-events-none absolute top-0 left-0 size-6 text-navy opacity-0">
      <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" />
    </svg>
  );
}
