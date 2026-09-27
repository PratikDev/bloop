"use client";

import { DATA_PATHS } from "@/lib/data";
import { rainPlotSource } from "@/lib/truth";
import { useT } from "../AppState/use-app-state";
import { useLiveData } from "../LiveData/use-live-data";
import { StatusBadge } from "../StatusBadge";
import { OceanCheck, RainCheck } from "./Checks";

/**
 * How we know the sound is right. Wording is built from the JSON numbers and
 * marked pending until the team approves new §16 wording (contract-proposals §A).
 */
export function TruthPanel() {
  const { rain, rainStatus } = useLiveData();
  const t = useT();
  const plot = rain ? rainPlotSource(rain.meta) : null;

  return (
    <div className="space-y-6">
      <p className="text-haze">{t("truth.intro")}</p>

      <section className="space-y-2">
        <h3 className="text-lead font-medium">{t("truth.ocean.heading")}</h3>
        <OceanCheck />
      </section>

      <section className="space-y-2">
        <h3 className="text-lead font-medium">{t("truth.rain.heading")}</h3>
        {rainStatus === "loading" && <StatusBadge kind="loading">{t("badge.loadingRain")}</StatusBadge>}
        {rainStatus === "error" && <StatusBadge kind="error">{t("error.rain")}</StatusBadge>}
        {rain && <RainCheck meta={rain.meta} />}
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
