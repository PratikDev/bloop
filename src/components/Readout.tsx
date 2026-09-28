"use client";

import { Fragment } from "react";
import { cn } from "@/lib/utils";
import { formatRainRate, formatTemperature, type Lang } from "@/lib/i18n";
import { rainText, type Reading } from "@/lib/reading";
import { useAppState, useT } from "./AppState/use-app-state";
import { FrameLabel } from "./FrameLabel";
import { useShownPoint } from "./TimeLapse/use-shown-point";

const BENGALI_DIGIT = /[০-৯]/;

/** Bengali digits aren't tabular in Anek Bangla, so each gets a fixed cell (design-plan §3.1). */
function Figure({ text, lang }: { text: string; lang: Lang }) {
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

function hero(r: Reading, track: string, lang: Lang): { figure: string; unit: "unit.celsius" | "unit.mmPerHour" } | null {
  if (track !== "rain") {
    return r.ocean.valueC === null ? null : { figure: formatTemperature(r.ocean.valueC, lang), unit: "unit.celsius" };
  }
  const mm = r.rain.mmPerHour;
  return mm !== null && mm > 0 ? { figure: formatRainRate(mm, lang), unit: "unit.mmPerHour" } : null;
}

/**
 * The value under the cursor: the typographic hero. Visual only; screen readers
 * get the same reading from the map region and the live region.
 */
export function Readout({ className }: { className?: string }) {
  const { state } = useAppState();
  const t = useT();
  const { reading: r, cursor, track, timelapse } = useShownPoint();
  if (!r) return null;

  const main = hero(r, track, state.lang);
  const fallback = track === "rain" ? rainText(t, r.rain, r.rainLoaded) : t("reading.oceanNone");

  return (
    <div className={cn("space-y-1", className)}>
      <div aria-hidden="true" className="space-y-1">
        <p key={main?.figure ?? fallback} className="duration-100 animate-in fade-in">
          {main ? (
            <span className="readout-figure text-readout-mobile md:text-readout lg:max-xl:text-readout-mobile xl:short:text-readout-mobile">
              <Figure text={main.figure} lang={state.lang} />
              <span className="text-lead font-medium text-haze">{" " + t(main.unit)}</span>
            </span>
          ) : (
            <span className="text-title font-medium">{fallback}</span>
          )}
        </p>
        {track === "both" && <p className="text-lead font-medium">{rainText(t, r.rain, r.rainLoaded)}</p>}
        <p className="text-lead font-medium">{t("place.latlon", cursor)}</p>
        {timelapse && <p className="text-small text-haze">{t("timelapse.frame", { index: timelapse.index + 1, total: timelapse.total })}</p>}
      </div>
      <FrameLabel className="max-w-md pt-1 lg:short:max-w-none" />
    </div>
  );
}
