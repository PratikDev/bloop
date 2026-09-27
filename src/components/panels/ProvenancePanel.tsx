"use client";

import type { ReactNode } from "react";
import { formatUtc } from "@/lib/i18n";
import { oceanText, rainText } from "@/lib/reading";
import { useAppState, useT } from "../AppState/use-app-state";
import { useLiveData } from "../LiveData/use-live-data";
import { StatusBadge } from "../StatusBadge";
import { useShownPoint } from "../TimeLapse/use-shown-point";
import { OceanCheck, RainCheck } from "./Checks";

/** One frame's facts, from its metadata file. */
function FrameFacts({
  heading,
  value,
  meta,
  frameTime,
  check,
}: {
  heading: string;
  value: string;
  meta: { source_dataset: string; svs_id: number; svs_page: string };
  frameTime: string;
  check: ReactNode;
}) {
  const t = useT();
  return (
    <section className="space-y-2">
      <h3 className="text-lead font-medium">{heading}</h3>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        <dt className="text-haze">{t("provenance.value")}</dt>
        <dd>{value}</dd>
        <dt className="text-haze">{t("provenance.dataset")}</dt>
        <dd>{meta.source_dataset}</dd>
        <dt className="text-haze">{t("provenance.visualization")}</dt>
        <dd>
          <a href={meta.svs_page} target="_blank" rel="noreferrer" className="underline underline-offset-2">
            {t("provenance.svs", { id: meta.svs_id })}
          </a>
        </dd>
        <dt className="text-haze">{t("provenance.frameTime")}</dt>
        <dd>{frameTime}</dd>
      </dl>
      <div className="space-y-1">
        <h4 className="text-haze">{t("provenance.check")}</h4>
        {check}
      </div>
    </section>
  );
}

/**
 * Where the value under the cursor comes from (P opens it): value, full
 * dataset name, SVS visualization, frame time and check, all from L1's
 * metadata, with the Truth panel's honesty rules.
 */
export function ProvenancePanel() {
  const { state } = useAppState();
  const { sst, rain, rainStatus } = useLiveData();
  const { reading, cursor, track, timelapse } = useShownPoint();
  const t = useT();
  if (!sst || !reading) return <p className="text-haze">{t("start.loading")}</p>;
  const time = (iso: string) => t("provenance.utc", { datetime: formatUtc(iso, state.lang) });

  return (
    <div className="space-y-6">
      <p className="text-haze">{t("provenance.at", { place: t("place.latlon", cursor) })}</p>
      {track !== "rain" && (
        <FrameFacts
          heading={t("frame.product.ocean")}
          value={oceanText(t, reading.ocean)}
          meta={sst.meta}
          frameTime={time(sst.meta.frame_time_utc)}
          check={<OceanCheck />}
        />
      )}
      {track !== "ocean" && rainStatus === "loading" && <StatusBadge kind="loading">{t("badge.loadingRain")}</StatusBadge>}
      {track !== "ocean" && rainStatus === "error" && <StatusBadge kind="error">{t("error.rain")}</StatusBadge>}
      {track !== "ocean" && rain && (
        <FrameFacts
          heading={t("frame.product.rain")}
          value={rainText(t, reading.rain, reading.rainLoaded)}
          meta={rain.meta}
          frameTime={`${time(timelapse?.timeUtc ?? rain.meta.frame_time_utc)} (${rain.meta.frame_time_meaning})`}
          check={
            <>
              {timelapse && (
                <p className="text-small text-haze">
                  {t("provenance.checkIsToday", { datetime: formatUtc(rain.meta.frame_time_utc, state.lang) })}
                </p>
              )}
              <RainCheck meta={rain.meta} />
            </>
          }
        />
      )}
    </div>
  );
}
