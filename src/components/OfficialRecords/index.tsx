"use client";

import { useCallback, useRef, useState, type KeyboardEvent } from "react";
import { brailleLabel } from "@/a11y/aria";
import { isLetter, isTypingTarget } from "@/a11y/keys";
import { Button } from "@/components/ui/button";
import { ruleText, voiceSpec } from "@/lib/audio/mapping";
import { loadOfficialIndex, type OfficialReading } from "@/lib/data";
import { formatFixed, formatUtc, type BoundT, type Lang } from "@/lib/i18n";
import { useLoaded } from "@/hooks/use-loaded";
import type { OfficialLayer } from "@/types/data-contract";
import { useAppState, useT } from "../AppState/use-app-state";
import { ChoiceGroup } from "../ChoiceGroup";
import { StatusBadge } from "../StatusBadge";
import { ProvenanceCard } from "./ProvenanceCard";
import { RecordControls } from "./RecordControls";
import { RecordMap } from "./RecordMap";
import { recordBrailleLabel } from "./braille-label";
import { OfficialBrailleExplorer } from "./OfficialBrailleExplorer";
import { RelatedRecords } from "./RelatedRecords";
import { useOfficialRecord } from "./use-official-record";

const SIGNIFICANT = 3;

function readingText(t: BoundT, lang: Lang, r: OfficialReading | null, layer: OfficialLayer | undefined): string {
  if (!r) return t("official.noValue");
  const value = formatFixed(r.value, lang, Math.max(0, SIGNIFICANT - 1 - Math.floor(Math.log10(Math.abs(r.value) || 1))));
  const key = !r.below ? "official.value" : layer?.below_kind === "at_or_below" ? "official.atLimit" : "official.below";
  return t(key, { value, unit: layer?.unit ?? "" });
}

/** A frame-space layer (no georeference): the needle as a share of the picture's width and height. */
function framePlace(t: BoundT, lang: Lang, at: { lat: number; lon: number }, layer: OfficialLayer): string {
  const [west, south, east, north] = layer.grid.bounds;
  const pct = (v: number, lo: number, hi: number) => formatFixed((100 * (v - lo)) / (hi - lo), lang, 0);
  return t("official.framePos", { x: pct(at.lon, west, east), y: pct(at.lat, south, north) });
}

function Player({ record }: { record: string }) {
  const { state } = useAppState();
  const t = useT();
  const rec = useOfficialRecord(record, state.soundOn);
  const [brailleOpen, setBrailleOpen] = useState(false);
  const brailleButton = useRef<HTMLButtonElement>(null);
  const closeBraille = useCallback(() => {
    setBrailleOpen(false);
    brailleButton.current?.focus();
  }, []);
  // B opens the explorer while the record has focus (never while typing in a field).
  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (!isLetter(e, "b") || isTypingTarget(e.target)) return;
    e.preventDefault();
    setBrailleOpen((o) => !o);
  };
  if (rec.error) return <StatusBadge kind="error">{t("official.error")}</StatusBadge>;
  if (!rec.manifest || !rec.option) return <StatusBadge kind="loading">{t("official.loading")}</StatusBadge>;
  const map = rec.grids[rec.option.map];
  const first = rec.readings[0];
  const statementOf = (ids: string[]) => ids.map((id) => rec.manifest?.layers.find((l) => l.id === id)?.statement).find(Boolean);
  const mapStatement = statementOf([rec.option.channels[0]?.layers[0] ?? rec.option.map]);
  const text = `${readingText(t, state.lang, first?.reading ?? null, map?.layer)}${mapStatement ? ` (${mapStatement})` : ""}`;
  const place = map?.layer.grid.space === "frame" ? framePlace(t, state.lang, rec.needle, map.layer) : t("place.latlon", rec.needle);
  const times = map?.layer.times ?? [];
  const timeText = map?.layer.time_labels?.[rec.step] ?? (times[rec.step] ? formatUtc(times[rec.step], state.lang) : "");
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]" onKeyDown={onKeyDown}>
      <div className="space-y-3">
        {map && rec.ready ? (
          <RecordMap grid={map} step={rec.step} needle={rec.needle} onMove={rec.moveNeedle}
            label={t("official.map", { layer: map.layer.label, time: timeText, reading: text })} />
        ) : (
          <StatusBadge kind="loading">{t("official.loading")}</StatusBadge>
        )}
        <p aria-live="off" className="text-body">
          {place}: {text}
        </p>
        <ul className="space-y-1 text-small text-haze">
          {rec.option.channels.map((c) => (
            <li key={c.voice}>
              {ruleText(voiceSpec(c.voice))}
              {statementOf(c.layers) && ` (${statementOf(c.layers)})`}
            </li>
          ))}
        </ul>
        <RecordControls rec={rec} timeText={timeText} readingText={`${place}: ${text}`} />
        <Button ref={brailleButton} variant="outline" className="h-11" disabled={!rec.ready} aria-expanded={brailleOpen}
          onClick={() => setBrailleOpen((o) => !o)} {...brailleLabel(t("braille.bl.braille"))}>
          {t("braille.open")}
        </Button>
        {brailleOpen && <OfficialBrailleExplorer rec={rec} onClose={closeBraille} />}
      </div>
      <ProvenanceCard manifest={rec.manifest} validation={rec.validation} />
    </div>
  );
}

/** The Official mode: every Challenge #14 resource decoded into data, one plain voice each, with its provenance. */
export function OfficialRecords() {
  const t = useT();
  const { value: index, error } = useLoaded(loadOfficialIndex);
  const [record, setRecord] = useState<string | null>(null);
  if (error) return <StatusBadge kind="error">{t("official.error")}</StatusBadge>;
  if (!index) return <StatusBadge kind="loading">{t("official.loading")}</StatusBadge>;
  const current = record ?? index.records[0]?.record;
  return (
    <section className="min-h-0 space-y-4 overflow-y-auto bg-night px-4 py-4" aria-labelledby="official-heading">
      <div className="space-y-1">
        <h2 id="official-heading" className="text-lead font-medium">{t("official.heading")}</h2>
        <p className="text-haze">{t("official.intro")}</p>
      </div>
      <ChoiceGroup label={t("official.records")} value={current ?? ""} onChange={setRecord} className="flex-wrap"
        options={index.records.map((r) => ({ value: r.record, label: r.title, brailleLabel: recordBrailleLabel(r) }))} />
      {current && <Player key={current} record={current} />}
      <RelatedRecords value={current ?? ""} onChange={setRecord} />
    </section>
  );
}
