"use client";

import { Button } from "@/components/ui/button";
import type { LatLon } from "@/lib/data";
import { nearestOfClass } from "@/lib/earth/class-grid";
import type { LandslideGrid } from "@/lib/earth/landslide";
import { useT } from "../../AppState/use-app-state";

/** "Hear an example": moves the needle to the nearest cell of a class, so each class's sound can be heard. */
export function ExampleButton({ code, label, grid, from, onGo }: { code: number; label: string; grid: LandslideGrid | null; from: LatLon; onGo(to: LatLon): void }) {
  const t = useT();
  const at = grid ? nearestOfClass(grid.meta.grid, grid.codes, code, from.lat, from.lon) : null;
  if (!at) return null;
  return (
    <Button variant="ghost" className="h-9 rounded-full px-3 text-small text-moon ring-1 ring-glass-edge" data-example-class={code} aria-label={t("earth.slide.exampleFor", { cls: label })} onClick={() => onGo(at)}>
      {t("earth.slide.example")}
    </Button>
  );
}
