"use client";

import { formatUtc } from "@/lib/i18n";
import { oceanTruth, rainTruth } from "@/lib/truth";
import type { RainMetadata, SstMetadata } from "@/types/data-contract";
import { useAppState, useT } from "../AppState/use-app-state";
import { StatusBadge } from "../StatusBadge";

/**
 * How each live frame was checked, shared by the Truth and Provenance panels
 * so both follow the same honesty rules (contract-proposals §A).
 */

/**
 * Ocean: the book §13.2 sentence with today's numbers once the recalibrated scale has been
 * re-checked on a separate frame (latest_check, A1); until then, no number.
 */
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
      <p>{t("truth.ocean.sentence", truth)}</p>
      <p className="text-small text-haze">
        {t("truth.ocean.frameOf", { date: truth.date })} {t("truth.checkedOn", { datetime: formatUtc(truth.checkedUtc, state.lang) })}
      </p>
    </>
  );
}

/** Rain: the sentence built from rain.json, marked pending until the team approves the wording (A2). */
export function RainCheck({ meta }: { meta: RainMetadata }) {
  const { state } = useAppState();
  const t = useT();
  const truth = rainTruth(meta);
  return (
    <>
      <StatusBadge kind="pending">{t("badge.pending")}</StatusBadge>
      <p>{t("truth.rain.sentence", truth)}</p>
      {truth.checkedUtc && (
        <p className="text-small text-haze">{t("truth.checkedOn", { datetime: formatUtc(truth.checkedUtc, state.lang) })}</p>
      )}
    </>
  );
}
