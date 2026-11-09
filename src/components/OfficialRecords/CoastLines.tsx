"use client";

import { useMemo } from "react";
import { useLoaded } from "@/hooks/use-loaded";
import { loadGeoFiles } from "@/lib/geo/load-files";
import type { AreaGeometry, Position } from "@/lib/geo/types";

const ringsOf = (geometry: AreaGeometry): Position[][] => (geometry.type === "Polygon" ? geometry.coordinates : geometry.coordinates.flat());

/** Country outlines over a record's map, so its shapes have geography. Lines only: the data colours underneath are untouched. */
export function CoastLines({ bounds }: { bounds: readonly [number, number, number, number] }) {
  const [west, south, east, north] = bounds;
  const files = useLoaded(loadGeoFiles).value;
  const path = useMemo(() => {
    if (!files) return "";
    return files.countries110m.features
      .flatMap((f) => (f.geometry ? ringsOf(f.geometry) : []))
      .map((ring) => `M${ring.map(([lon, lat]) => `${(lon - west).toFixed(2)} ${(north - lat).toFixed(2)}`).join("L")}Z`)
      .join("");
  }, [files, west, north]);
  if (!path) return null;
  return (
    <svg aria-hidden="true" viewBox={`0 0 ${east - west} ${north - south}`} preserveAspectRatio="none" className="pointer-events-none absolute inset-0 size-full">
      <path d={path} fill="none" strokeWidth="1" vectorEffect="non-scaling-stroke" className="stroke-navy" />
    </svg>
  );
}
