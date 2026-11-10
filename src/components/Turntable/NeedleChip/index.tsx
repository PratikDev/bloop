"use client";

import { useEffect, useRef, useState } from "react";
import { rainText } from "@/lib/reading";
import { cn } from "@/lib/utils";
import { useAppState, useT } from "../../AppState/use-app-state";
import { useLiveData } from "../../LiveData/use-live-data";
import { Figure, hero } from "../../Readout";
import { useShownPoint } from "../../TimeLapse/use-shown-point";
import { FrameFacts } from "../FrameFacts";
import { useTT } from "../i18n";
import type { Rect } from "../LabelLayer";
import { recordFrames } from "../records";
import type { Turntable } from "../use-turntable";
import { ChipFrame } from "./ChipFrame";
import type { Details } from "./use-details";

interface Props {
  subscribe: Turntable["subscribe"];
  /** Full place line ("Bay of Bengal", "341 km SE of Bhubaneswar, India"). */
  place: string | null;
  details: Details;
  /** Areas labels must keep clear of, updated here each frame. */
  reserved: { current: Rect[] };
  /** Where the readout stays (null until that element exists). */
  dock: HTMLElement | null;
}

/**
 * The value under the needle in a pill docked clear of the globe, expanding into a
 * details card (ChipFrame). The same reading is spoken on Enter and on
 * arrival (live region).
 */
export function NeedleChip({ subscribe, place, details, reserved, dock }: Props) {
  const { state } = useAppState();
  const { fields } = useLiveData();
  const t = useT();
  const { tt } = useTT();
  const { reading: r, cursor, track } = useShownPoint();
  const [now] = useState(Date.now);
  const swatch = useRef<HTMLSpanElement>(null);

  // The same pixel as the swatch at the needle, written straight to the element: it changes with every frame the needle moves.
  useEffect(() => {
    let shown = "";
    return subscribe((f) => {
      const colour = f.swatch ? `rgb(${f.swatch.join(" ")})` : "";
      if (colour === shown || !swatch.current) return;
      shown = colour;
      swatch.current.style.backgroundColor = colour;
    });
  }, [subscribe]);

  const main = r ? hero(r, track, state.lang) : null;
  const fallback = r && (track === "rain" ? rainText(t, r.rain, r.rainLoaded) : t("reading.oceanNone"));

  return (
    <ChipFrame
      subscribe={subscribe}
      details={details}
      reserved={reserved}
      dock={dock}
      label={tt("turntable.details.open")}
      chip={
        r && (
          <>
            <span ref={swatch} data-swatch aria-hidden="true" className="inline-block size-3.5 shrink-0 self-center rounded-full border-2 border-navy bg-paper" />
            {/* A number stays on one line; the "no data" sentence may wrap on a phone. */}
            <span className={cn("readout-figure text-title text-moon", main && "whitespace-nowrap")}>
              {main ? (
                <>
                  <Figure text={main.figure} lang={state.lang} /> {t(main.unit)}
                </>
              ) : (
                fallback
              )}
            </span>
            {track === "both" && (
              <span className="text-body text-moon">
                {rainText(t, r.rain, r.rainLoaded)}
              </span>
            )}
            {place && <span className="basis-full text-body text-haze">{place}</span>}
            <span className="basis-full text-small text-haze max-sm:hidden">
              {t("place.latlon", cursor)}
            </span>
          </>
        )
      }
      headline={
        <p className="readout-figure text-value leading-none text-moon">
          {main ? (
            <>
              <Figure text={main.figure} lang={state.lang} />
              <span className="text-lead font-medium">{" " + t(main.unit)}</span>
            </>
          ) : (
            <span className="text-title">
              {fallback}
            </span>
          )}
        </p>
      }
    >
      <div className="space-y-2">
        {recordFrames(track, fields).map((f) => (
          <FrameFacts key={f.product} frame={f} now={now} tt={tt} />
        ))}
      </div>
    </ChipFrame>
  );
}
