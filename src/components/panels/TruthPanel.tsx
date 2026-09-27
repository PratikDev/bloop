"use client";

import { DATA_PATHS } from "@/lib/data";
import { formatUtc } from "@/lib/i18n";
import { rainPlotSource, rainTruth } from "@/lib/truth";
import { useAppState, useT } from "../AppState/use-app-state";
import { useLiveData } from "../LiveData/use-live-data";
import { StatusBadge } from "../StatusBadge";

/**
 * How we know the sound is right. Wording is built from the JSON numbers and
 * marked pending until the team approves new §16 wording (contract-proposals §A).
 */
export function TruthPanel() {
  const { state } = useAppState();
  const { rain, rainStatus } = useLiveData();
  const t = useT();
  const truth = rain ? rainTruth(rain.meta) : null;
  const plot = rain ? rainPlotSource(rain.meta) : null;

  return (
    <div className="space-y-6">
      <p className="text-haze">{t("truth.intro")}</p>

      <section className="space-y-2">
        <h3 className="text-lead font-medium">{t("truth.ocean.heading")}</h3>
        <p className="text-lead">{t("truth.ocean.updating")}</p>
        <p className="text-small text-haze">{t("truth.ocean.updatingNote")}</p>
      </section>

      <section className="space-y-2">
        <h3 className="text-lead font-medium">{t("truth.rain.heading")}</h3>
        {rainStatus === "loading" && <StatusBadge kind="loading">{t("badge.loadingRain")}</StatusBadge>}
        {rainStatus === "error" && <StatusBadge kind="error">{t("error.rain")}</StatusBadge>}
        {truth && (
          <>
            <StatusBadge kind="pending">{t("badge.pending")}</StatusBadge>
            <p>{t("truth.rain.sentence", truth)}</p>
            {truth.checkedUtc && (
              <p className="text-small text-haze">{t("truth.checkedOn", { datetime: formatUtc(truth.checkedUtc, state.lang) })}</p>
            )}
          </>
        )}
        {plot && (
          <figure className="space-y-1 pt-2">
            {/* A static published chart image; next/image adds nothing for a local PNG this small. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={DATA_PATHS.truthImage("rain_compare")}
              alt={t("truth.rain.plotAlt")}
              width={600}
              height={600}
              loading="lazy"
              className="w-full max-w-xs rounded-lg"
            />
            <figcaption className="text-small text-haze">{t("truth.rain.plotCaption", plot)}</figcaption>
          </figure>
        )}
      </section>
    </div>
  );
}
