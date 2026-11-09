"use client";

import { useState } from "react";
import { rainText } from "@/lib/reading";
import { useAppState, useT } from "../../AppState/use-app-state";
import { useLiveData } from "../../LiveData/use-live-data";
import { Figure, hero } from "../../Readout";
import { useShownPoint } from "../../TimeLapse/use-shown-point";
import { FrameFacts } from "../FrameFacts";
import { En, useTT } from "../i18n";
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
}

/**
 * The value under the needle as a small pill beside it, expanding into a
 * details card (ChipFrame). The same reading is spoken on Enter and on
 * arrival (live region).
 */
export function NeedleChip({ subscribe, place, details, reserved }: Props) {
  const { state } = useAppState();
  const { fields } = useLiveData();
  const t = useT();
  const { tt, lang } = useTT();
  const { reading: r, cursor, track } = useShownPoint();
  const [now] = useState(Date.now);

  const main = r ? hero(r, track, state.lang) : null;
  const bn = lang === "bn";
  const fallback = r && (track === "rain" ? rainText(t, r.rain, r.rainLoaded) : t("reading.oceanNone"));

  return (
    <ChipFrame
      subscribe={subscribe}
      details={details}
      reserved={reserved}
      label={tt("turntable.details.open")}
      chip={
        r && (
          <>
            <span className="readout-figure text-title whitespace-nowrap text-moon">
              {main ? (
                <>
                  <Figure text={main.figure} lang={state.lang} /> {t(main.unit)}
                </>
              ) : (
                <En active={bn}>{fallback}</En>
              )}
            </span>
            {track === "both" && (
              <span className="text-body text-moon">
                <En active={bn}>{rainText(t, r.rain, r.rainLoaded)}</En>
              </span>
            )}
            {place && <span className="basis-full text-body text-haze">{place}</span>}
            <span className="basis-full text-small text-haze">
              <En active={bn}>{t("place.latlon", cursor)}</En>
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
              <En active={bn}>{fallback}</En>
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
