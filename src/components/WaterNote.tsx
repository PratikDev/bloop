"use client";

import type { GraceContextFile } from "@/types/data-contract";
import { useT } from "./AppState/use-app-state";

/**
 * Mentor item 12: underground water is one Bangladesh-wide GRACE record, not a city's. The mascon size comes from the
 * product's own metadata (grace.json `mascon_deg`, read from the NetCDF by build_context.py). Shown in both Then vs
 * Now views for every city, above the chart so it is on screen without scrolling.
 */
export function WaterNote({ grace }: { grace: GraceContextFile }) {
  const t = useT();
  return (
    <p data-testid="water-note" className="text-small text-moon">
      {t("water.bangladeshWide", { deg: grace.mascon_deg })}
    </p>
  );
}
