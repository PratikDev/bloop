"use client";

import { Button } from "@/components/ui/button";
import { useLoaded } from "@/hooks/use-loaded";
import { continuousRule, semitonesPerUnit, unisonTones } from "@/lib/audio/mapping";
import { loadSstAnomalyMeta, loadSstPairs, loadThreeWay, nearestPair } from "@/lib/data";
import { useAppState, useT } from "../AppState/use-app-state";
import { useCommands } from "../Commands/use-commands";
import { ProductBadges } from "../SourceBadges/ProductBadges";
import { StatusBadge } from "../StatusBadge";
import { ProofHelix } from "./ProofHelix";

/** SVS 5176 vs NOAA Coral Reef Watch (book §13.2 wording; numbers from sst_anom.json). */
export function AnomalyCheck() {
  const t = useT();
  const { value: meta, error } = useLoaded(loadSstAnomalyMeta);
  if (error) return <StatusBadge kind="error">{t("truth.anomaly.error")}</StatusBadge>;
  const v = meta?.verified;
  if (!v || v.sign_agreement === null || v.n_abs_ge_0_5 === null || v.median_offset_C === null) return null;
  return (
    <>
      <ProductBadges product="sst_anom" />
      <p>{t("truth.anomaly.sentence", { signPct: v.sign_agreement * 100, n: v.n_abs_ge_0_5, offset: v.median_offset_C })}</p>
      <p className="text-small text-haze">{meta.disclosure}</p>
    </>
  );
}

/** Frame vs NASA's GIBS layer vs the MUR file at the same points (threeway.json). */
export function ThreeWayCheck() {
  const t = useT();
  const { value: file } = useLoaded(loadThreeWay);
  const s = file?.summary;
  if (!file || !s || s.median_abs_gibs_vs_file === null || s.median_abs_frame_vs_file === null) return null;
  return (
    <>
      <p>
        {t("truth.threeway.sentence", { n: s.n_gibs, gibs: s.median_abs_gibs_vs_file, frame: s.median_abs_frame_vs_file, decodePct: file.gibs_decode_share * 100 })}
      </p>
      <p className="text-small text-haze">{file.disclosure}</p>
    </>
  );
}

/** Proof in unison (C1): the rule in words, the checked point nearest the cursor, and a button (= the U key). */
export function UnisonCheck() {
  const { state } = useAppState();
  const t = useT();
  const commands = useCommands();
  const { value: file } = useLoaded(loadSstPairs);
  const perDegree = semitonesPerUnit(continuousRule("unison"));
  if (!file || perDegree === null) return null;
  const near = nearestPair(file.pairs, state.cursor.lat, state.cursor.lon);
  const tones = near ? unisonTones(near.pair.frame, near.pair.file) : null;
  return (
    <>
      <p>{t("truth.unison.explain", { median: file.check.median_abs, semitones: file.check.median_abs * perDegree })}</p>
      {near && tones && (
        <>
          <ProofHelix beatsPerSec={tones.beatsPerSec} label={t("truth.unison.helix", { beats: tones.beatsPerSec })} />
          <p className="text-small text-haze">{t("truth.unison.pair", { frame: near.pair.frame, file: near.pair.file, beats: tones.beatsPerSec })}</p>
        </>
      )}
      <Button variant="outline" onClick={commands.playUnison}>
        {t("truth.unison.play")} <kbd className="ml-1 text-small text-haze">U</kbd>
      </Button>
    </>
  );
}
