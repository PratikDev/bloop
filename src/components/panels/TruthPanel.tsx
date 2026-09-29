"use client";

import { DATA_PATHS } from "@/lib/data";
import { rainTruth } from "@/lib/truth";
import { useT } from "../AppState/use-app-state";
import { useLiveData } from "../LiveData/use-live-data";
import { StatusBadge } from "../StatusBadge";
import { OceanCheck, RainCheck } from "./Checks";
import { GlobeTeaser } from "./GlobeTeaser";

/**
 * How we know the sound is right: L1's check wording (DATA_HANDOFF §4), filled
 * from the JSON and marked pending until the team adopts it in plan §16.
 * The sections are shared by the Listen page's Inspector and How we know.
 */

export function OceanTruth({ showHeading = true }: { showHeading?: boolean }) {
  const { sst } = useLiveData();
  const t = useT();
  return (
    <section className="space-y-2">
      {showHeading && <h3 className="text-lead font-medium">{t("truth.ocean.heading")}</h3>}
      {/* The ocean plot (truth/sst_compare.png) waits until L1 redraws it with the recalibrated scale. */}
      {sst && <OceanCheck meta={sst.meta} />}
    </section>
  );
}

export function RainTruth({ showHeading = true }: { showHeading?: boolean }) {
  const { rain, rainStatus } = useLiveData();
  const t = useT();
  const plot = rain ? rainTruth(rain.meta) : null;
  return (
    <section className="space-y-2">
      {showHeading && <h3 className="text-lead font-medium">{t("truth.rain.heading")}</h3>}
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
  );
}

export function TruthPanel() {
  const t = useT();
  return (
    <div className="space-y-6">
      <p className="text-haze">{t("truth.intro")}</p>
      <OceanTruth />
      <RainTruth />
      <GlobeTeaser />
    </div>
  );
}
