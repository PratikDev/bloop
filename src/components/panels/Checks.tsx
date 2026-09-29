"use client";

import { formatDay, formatUtc } from "@/lib/i18n";
import { oceanTruth, rainTruth } from "@/lib/truth";
import type { RainMetadata, SstMetadata } from "@/types/data-contract";
import { useAppState, useT } from "../AppState/use-app-state";
import { StatusBadge } from "../StatusBadge";

/**
 * How each live frame was checked, shared by the Truth and Provenance panels
 * so both follow the same honesty rules. Wording is L1's template, filled from
 * the frame's JSON, and marked pending until the team adopts it (plan §16).
 */

/** Ocean: the colour-scale check and, if it passed, the re-check on a later frame. */
export function OceanCheck({ meta }: { meta: SstMetadata }) {
  const { state } = useAppState();
  const t = useT();
  const truth = oceanTruth(meta);
  if (!truth) {
    return (
      <>
        <p className="text-lead">{t("truth.ocean.updating")}</p>
        <p className="text-small text-haze">{t("truth.ocean.updatingNote")}</p>
      </>
    );
  }
  return (
    <>
      <StatusBadge kind="pending">{t("badge.pending")}</StatusBadge>
      <p>
        {t("truth.ocean.sentence", truth)}
        {truth.recheck && ` ${t("truth.ocean.recheck", { date: formatDay(truth.recheck.date, state.lang), median: truth.recheck.median })}`}
      </p>
    </>
  );
}

/** Rain: the original check and, if it passed, the newest frame's re-check. */
export function RainCheck({ meta }: { meta: RainMetadata }) {
  const { state } = useAppState();
  const t = useT();
  const truth = rainTruth(meta);
  return (
    <>
      <StatusBadge kind="pending">{t("badge.pending")}</StatusBadge>
      <p>
        {t("truth.rain.sentence", truth)}
        {truth.recheckRun && ` ${t("truth.rain.recheck", { run: truth.recheckRun })}`}
      </p>
      {truth.checkedUtc && (
        <p className="text-small text-haze">{t("truth.checkedOn", { datetime: formatUtc(truth.checkedUtc, state.lang) })}</p>
      )}
    </>
  );
}
