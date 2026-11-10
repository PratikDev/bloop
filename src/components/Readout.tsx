"use client";

import { Fragment } from "react";
import { usePlaceName } from "@/hooks/use-place-name";
import { cn } from "@/lib/utils";
import { formatRainRate, formatTemperature, type Lang } from "@/lib/i18n";
import { rainText, type Reading } from "@/lib/reading";
import { useAppState, useT } from "./AppState/use-app-state";
import { useShownPoint } from "./TimeLapse/use-shown-point";

const BENGALI_DIGIT = /[০-৯]/;

/** Bengali digits aren't tabular in Anek Bangla, so each gets a fixed cell (design-plan §3.1). */
export function Figure({ text, lang }: { text: string; lang: Lang }) {
  if (lang !== "bn") return <>{text}</>;
  return (
    <>
      {[...text].map((ch, i) =>
        BENGALI_DIGIT.test(ch) ? (
          <span key={i} className="digit-cell">
            {ch}
          </span>
        ) : (
          <Fragment key={i}>{ch}</Fragment>
        ),
      )}
    </>
  );
}

/** The reading's headline figure for a track (ocean °C, or rain mm/h on the Rain track); null = none. */
export function hero(r: Reading, track: string, lang: Lang): { figure: string; unit: "unit.celsius" | "unit.mmPerHour" } | null {
  if (track !== "rain") {
    return r.ocean.valueC === null ? null : { figure: formatTemperature(r.ocean.valueC, lang), unit: "unit.celsius" };
  }
  const mm = r.rain.mmPerHour;
  return mm !== null && mm > 0 ? { figure: formatRainRate(mm, lang), unit: "unit.mmPerHour" } : null;
}

/**
 * The value under the needle, on the player right under the map: the figure and the rain, then the place. No boxes. Visual only; screen readers get the same reading from the map region and the live region.
 */
export function Readout({ className }: { className?: string }) {
  const { state } = useAppState();
  const t = useT();
  const { reading: r, cursor, track, timelapse } = useShownPoint();
  const place = usePlaceName(cursor);
  if (!r) return null;

  const main = hero(r, track, state.lang);
  const fallback = track === "rain" ? rainText(t, r.rain, r.rainLoaded) : t("reading.oceanNone");

  return (
    <div data-slot="readout" aria-hidden="true" className={cn("min-w-0", className)}>
      <div className="flex items-baseline gap-x-3">
        {main ? (
          <p className="readout-figure text-title">
            <Figure text={main.figure} lang={state.lang} />
            <span className="font-sans text-body text-haze">{" " + t(main.unit)}</span>
          </p>
        ) : (
          <p className="text-lead">{fallback}</p>
        )}
        {track === "both" && <p className="text-body">{rainText(t, r.rain, r.rainLoaded)}</p>}
      </div>
      <p className="truncate text-small text-haze">{[place, timelapse ? t("timelapse.frame", { index: timelapse.index + 1, total: timelapse.total }) : t("place.latlon", cursor)].filter(Boolean).join(" · ")}</p>
    </div>
  );
}
