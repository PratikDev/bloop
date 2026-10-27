"use client";

import type { Ref } from "react";
import { formatUtc } from "@/lib/i18n";
import { rainText } from "@/lib/reading";
import { cn } from "@/lib/utils";
import { useAppState, useT } from "../AppState/use-app-state";
import { useLiveData } from "../LiveData/use-live-data";
import { Figure, hero } from "../Readout";
import { useShownPoint } from "../TimeLapse/use-shown-point";
import { En, useTT } from "./i18n";
import { frameAgeDays, recordFrames } from "./records";

/**
 * The value under the needle, its place and its frame time: a card that floats
 * beside the needle on wide screens and sits under the globe on phones. Visual
 * only; screen readers get the same through Enter and "Where am I?".
 */
export function ReadoutCard({ place, now, className, ref }: { place: string | null; now: number; className?: string; ref?: Ref<HTMLDivElement> }) {
  const { state } = useAppState();
  const { fields } = useLiveData();
  const t = useT();
  const { tt, lang } = useTT();
  const { reading: r, cursor, track } = useShownPoint();
  if (!r) return null;
  const main = hero(r, track, state.lang);
  const bn = lang === "bn";
  const fallback = track === "rain" ? rainText(t, r.rain, r.rainLoaded) : t("reading.oceanNone");

  return (
    <div ref={ref} aria-hidden="true" className={cn("w-72 space-y-1 rounded-lg border border-line bg-scrim p-3 shadow-lg", className)}>
      <p className="text-readout-mobile leading-none">
        {main ? (
          <span className="readout-figure">
            <Figure text={main.figure} lang={state.lang} />
            <span className="text-lead font-medium text-moon">{" " + t(main.unit)}</span>
          </span>
        ) : (
          <span className="text-title font-medium">
            <En active={bn}>{fallback}</En>
          </span>
        )}
      </p>
      {track === "both" && (
        <p className="text-body font-medium">
          <En active={bn}>{rainText(t, r.rain, r.rainLoaded)}</En>
        </p>
      )}
      {place && <p className="text-body font-medium text-moon">{place}</p>}
      <p className="text-body text-haze">
        <En active={bn}>{t("place.latlon", cursor)}</En>
      </p>
      {recordFrames(track, fields).map((f) => (
        <p key={f.product} className="text-body text-haze">
          {tt("turntable.frameTime", { datetime: formatUtc(f.meta.frame_time_utc, state.lang) })} ·{" "}
          {tt("turntable.age", { days: frameAgeDays(f.meta.frame_time_utc, now) })}
        </p>
      ))}
    </div>
  );
}
