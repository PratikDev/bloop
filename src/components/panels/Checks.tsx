"use client";

import { formatUtc } from "@/lib/i18n";
import { rainTruth } from "@/lib/truth";
import type { RainMetadata } from "@/types/data-contract";
import { useAppState, useT } from "../AppState/use-app-state";
import { StatusBadge } from "../StatusBadge";

/**
 * How each live frame was checked, shared by the Truth and Provenance panels
 * so both follow the same honesty rules (contract-proposals §A).
 */

/** Ocean: no number until the recalibrated error is checked on a separate frame (A1). */
export function OceanCheck() {
  const t = useT();
  return (
    <>
      <p className="text-lead">{t("truth.ocean.updating")}</p>
      <p className="text-small text-haze">{t("truth.ocean.updatingNote")}</p>
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
