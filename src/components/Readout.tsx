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
    <div data-slot="readout" className={cn("space-y-2", className)}>
      {/* From 1024 px off the map: one line under it, or a column beside it when the screen is wide (Listen). */}
      <div aria-hidden="true" className="space-y-1.5 lg:flex lg:flex-wrap lg:items-baseline lg:gap-x-6 lg:space-y-0 lg:listen-wide:block lg:listen-wide:space-y-1.5">
        <p key={main?.figure ?? fallback} className="duration-150 animate-in fade-in slide-in-from-bottom-1">
          {main ? (
            <span className="readout-figure text-readout-mobile md:text-readout lg:text-readout-strip lg:listen-wide:text-readout-mobile 2xl:listen-wide:text-readout">
              <Figure text={main.figure} lang={state.lang} />
              <span className="font-sans text-lead text-haze">{" " + t(main.unit)}</span>
            </span>
          ) : (
            <span className="font-serif text-title">{fallback}</span>
          )}
        </p>
        {track === "both" && <p className="text-lead">{rainText(t, r.rain, r.rainLoaded)}</p>}
        <p className="font-mono text-body tracking-tight text-moon">{t("place.latlon", cursor)}</p>
        {timelapse && <p className="font-mono text-small text-shapla">{t("timelapse.frame", { index: timelapse.index + 1, total: timelapse.total })}</p>}
      </div>
      {/* From 1024 px the frame times sit in the page head, above the map. */}
      <FrameLabel className="max-w-md border-t border-glass-edge pt-2 lg:hidden" />
    </div>
  );
}
