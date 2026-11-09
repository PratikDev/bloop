"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAppState, useT } from "../AppState/use-app-state";
import { bandText, RECORD_KEY, UNIT_KEY, useLvMap } from "./use-lv-map";

const NODATA_HATCH = "repeating-linear-gradient(45deg, var(--lv-hatch) 0 2px, transparent 2px 8px)";

/**
 * The re-coloured map's legend (accessibility core, step 8; spec 4.2), next to the map: every band's colour and range
 * in large text, what dry and no data look like, the "re-coloured by Bloop" label, and NASA's original colours on one
 * press. Shown only while the map is re-coloured.
 */
export function LvLegend({ className }: { className?: string }) {
  const { state, dispatch } = useAppState();
  const t = useT();
  const map = useLvMap();
  if (!map?.recoloured) return null;
  return (
    <section data-testid="lv-legend" aria-labelledby="lv-legend-title" className={cn("surface-plate space-y-2 rounded-plate p-3", className)}>
      <h2 id="lv-legend-title" className="text-lead font-semibold text-moon">
        {t("lv.legend", { record: t(RECORD_KEY[map.record]), unit: t(UNIT_KEY[map.record]) })}
      </h2>
      <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-lead text-moon">
        {map.bands.map((b, i) => (
          <li key={i} className="flex items-center gap-2">
            <span aria-hidden="true" className="size-6 shrink-0 rounded-sm border-2 border-moon" style={{ background: `var(${map.vars[i]})` }} />
            {bandText(t, state.lang, b)}
          </li>
        ))}
        <li className="flex items-center gap-2">
          {/* As the map draws it: land solid (ocean), no-data rain as a sparse hatch. */}
          <span aria-hidden="true" className="size-6 shrink-0 rounded-sm border-2 border-moon" style={{ background: map.record === "rain" ? NODATA_HATCH : "var(--lv-land)" }} />
          {t("lv.legend.nodata")}
        </li>
        {map.record === "rain" && (
          <li className="flex items-center gap-2">
            <span aria-hidden="true" className="size-6 shrink-0 rounded-sm border-2 border-moon bg-night" />
            {t("lv.legend.dry")}
          </li>
        )}
      </ul>
      <p data-testid="lv-recoloured" className="text-body text-haze">
        {t("lv.recoloured")}
      </p>
      {/* Wraps rather than widening the page (reflow at 320 px). */}
      <Button variant="outline" className="h-auto max-w-full shrink py-2 text-start whitespace-normal" onClick={() => dispatch({ type: "setLowVision", patch: { scheme: "original", bands: 0 } })}>
        {t("lv.showOriginal")}
      </Button>
    </section>
  );
}
