"use client";

import type { ReactNode } from "react";
import { DATA_PATHS } from "@/lib/data";
import { rainTruth } from "@/lib/truth";
import type { MessageKey } from "@/lib/i18n";
import { useT } from "../AppState/use-app-state";
import { useLiveData } from "../LiveData/use-live-data";
import { ProductBadges } from "../SourceBadges/ProductBadges";
import { StatusBadge } from "../StatusBadge";
import { OceanCheck, RainCheck } from "./Checks";
import { GlobeTeaser } from "./GlobeTeaser";
import { AnomalyCheck, ThreeWayCheck, UnisonCheck } from "./TruthChecks";

/**
 * How we know the sound is right: L1's check wording (DATA_HANDOFF §4), filled
 * from the JSON, each check with its source and data-age badges (meta/freshness.json).
 * The sections are shared by the Listen page's Inspector and How we know.
 */

type Product = Parameters<typeof ProductBadges>[0]["product"];

function TruthSection({ heading, product, showHeading = true, children }: { heading: MessageKey; product?: Product; showHeading?: boolean; children: ReactNode }) {
  const t = useT();
  return (
    <section className="space-y-2">
      {showHeading && <h3 className="text-lead font-medium">{t(heading)}</h3>}
      {product && <ProductBadges product={product} />}
      {children}
    </section>
  );
}

export function OceanTruth({ showHeading = true }: { showHeading?: boolean }) {
  const { sst } = useLiveData();
  return (
    <TruthSection heading="truth.ocean.heading" product="sst" showHeading={showHeading}>
      {/* The ocean plot (truth/sst_compare.png) waits until L1 redraws it with the recalibrated scale. */}
      {sst && <OceanCheck meta={sst.meta} />}
    </TruthSection>
  );
}

export function RainTruth({ showHeading = true }: { showHeading?: boolean }) {
  const { rain, rainStatus } = useLiveData();
  const t = useT();
  const plot = rain ? rainTruth(rain.meta) : null;
  return (
    <TruthSection heading="truth.rain.heading" product="rain" showHeading={showHeading}>
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
    </TruthSection>
  );
}

export function TruthPanel() {
  const t = useT();
  return (
    <div className="space-y-6">
      <p className="text-haze">{t("truth.intro")}</p>
      <OceanTruth />
      <TruthSection heading="truth.unison.heading">
        <UnisonCheck />
      </TruthSection>
      <TruthSection heading="truth.threeway.heading" product="threeway">
        <ThreeWayCheck />
      </TruthSection>
      <TruthSection heading="truth.anomaly.heading">
        <AnomalyCheck />
      </TruthSection>
      <RainTruth />
      <GlobeTeaser />
    </div>
  );
}
