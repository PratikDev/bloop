"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { getRouteApi } from "@tanstack/react-router";
import { brailleLabel } from "@/a11y/aria";
import { isLetter, isTypingTarget } from "@/a11y/keys";
import { Button } from "@/components/ui/button";
import { ruleText, voiceSpec } from "@/lib/audio/mapping";
import { loadOfficialIndex, PATTERN_ONLY, patternLevel, type OfficialReading } from "@/lib/data";
import { formatFixed, formatUtc, type BoundT, type Lang } from "@/lib/i18n";
import { plainStatement } from "@/lib/official-text";
import { useAnnounceError } from "@/hooks/use-announce-error";
import { useLoaded } from "@/hooks/use-loaded";
import type { OfficialBadge, OfficialLayer } from "@/types/data-contract";
import { useAppState, useT } from "../AppState/use-app-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Cabinet } from "../Cabinet";
import { InfoSheet } from "../InfoSheet";
import { RecordStrip } from "../Rack/RecordStrip";
import { useRecords } from "../Records/use-records";
import { StatusBadge } from "../StatusBadge";
import { ProvenanceCard } from "./ProvenanceCard";
import { PlayRecordButton, RecordControls } from "./RecordControls";
import { RecordMap } from "./RecordMap";
import { recordBrailleLabel } from "./braille-label";
import { OfficialBrailleExplorer } from "./OfficialBrailleExplorer";
import { RelatedRecords } from "./RelatedRecords";
import { useOfficialRecord } from "./use-official-record";
import { ROW_KEY } from "../row-key";
import { useRovingFocus } from "@/hooks/use-roving-focus";

const SIGNIFICANT = 3;

function readingText(t: BoundT, lang: Lang, r: OfficialReading | null, layer: OfficialLayer | undefined): string {
  if (!r) return t("official.noValue");
  if (layer?.status === PATTERN_ONLY) return t("official.pattern", { level: t(`level.${patternLevel(layer, r.value)}`) });
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

function Player({ record, related }: { record: string; related: ReactNode }) {
  const { state } = useAppState();
  const t = useT();
  const rec = useOfficialRecord(record, state.soundOn);
  const { setPlaying, setListening } = rec;
  // Stop (Esc, the dock) turns the app's sound off: the record stops with it, on both engines (src/lib/audio-engines.ts).
  useEffect(() => {
    if (state.playing) return;
    setPlaying(false);
    setListening(false);
  }, [state.playing, setPlaying, setListening]);
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
  const statementOf = (ids: string[]) => {
    const found = ids.map((id) => rec.manifest?.layers.find((l) => l.id === id)?.statement).find(Boolean);
    return found ? plainStatement(found) : undefined;
  };
  const mapStatement = statementOf([rec.option.channels[0]?.layers[0] ?? rec.option.map]);
  const text = `${readingText(t, state.lang, first?.reading ?? null, map?.layer)}${mapStatement ? ` (${mapStatement})` : ""}`;
  const place = map?.layer.grid.space === "frame" ? framePlace(t, state.lang, rec.needle, map.layer) : t("place.latlon", rec.needle);
  const times = map?.layer.times ?? [];
  const timeText = map?.layer.time_labels?.[rec.step] ?? (times[rec.step] ? formatUtc(times[rec.step], state.lang) : "");
  const sourcesTab = (
    <div className="space-y-4">
      <p className="text-haze">{t("official.intro")}</p>
      <ul className="space-y-1 text-small text-haze">
        {rec.option.channels.map((c) => (
          <li key={c.voice}>
            {ruleText(voiceSpec(c.voice))}
            {statementOf(c.layers) && ` (${statementOf(c.layers)})`}
          </li>
        ))}
      </ul>
      <ProvenanceCard manifest={rec.manifest} validation={rec.validation} />
    </div>
  );
  return (
    <div className="space-y-3" onKeyDown={onKeyDown}>
      <div className="official-stage min-w-0">
        {map && rec.ready ? (
          <RecordMap grid={map} step={rec.step} needle={rec.needle} onMove={rec.moveNeedle} label={t("official.map", { layer: map.layer.label, time: timeText, reading: text })} />
        ) : (
          <StatusBadge kind="loading">{t("official.loading")}</StatusBadge>
        )}
      </div>
      <div className="official-row flex flex-wrap items-center gap-4">
        <p aria-live="off" className="min-w-0 flex-1 basis-64 text-body">
          {place}: {readingText(t, state.lang, first?.reading ?? null, map?.layer)}
        </p>
        <PlayRecordButton rec={rec} />
        <InfoSheet title={t("official.details")} triggerClassName={ROW_KEY} trigger={t("official.details")}>
          <Tabs defaultValue="source" className="gap-4">
            <TabsList variant="line" aria-label={t("official.details")} className="w-full justify-start">
              <TabsTrigger value="source">{t("official.tab.source")}</TabsTrigger>
              <TabsTrigger value="controls">{t("official.tab.controls")}</TabsTrigger>
              <TabsTrigger value="credits">{t("official.credits")}</TabsTrigger>
            </TabsList>
            <TabsContent value="source" className="text-body">{sourcesTab}</TabsContent>
            <TabsContent value="controls" className="space-y-4 text-body">
              <RecordControls rec={rec} timeText={timeText} readingText={`${place}: ${text}`} />
              <Button ref={brailleButton} variant="outline" className="h-11" disabled={!rec.ready} aria-expanded={brailleOpen} onClick={() => setBrailleOpen((o) => !o)} {...brailleLabel(t("braille.bl.braille"))}>
                {t("braille.open")}
              </Button>
              {brailleOpen && <OfficialBrailleExplorer rec={rec} onClose={closeBraille} />}
              {related}
            </TabsContent>
            <TabsContent value="credits" className="text-body">
              <ProvenanceCard manifest={rec.manifest} validation={rec.validation} part="credits" />
            </TabsContent>
          </Tabs>
        </InfoSheet>
      </div>
    </div>
  );
}


// In code order: the list runs model, observation, reanalysis.
const KIND_ORDER: readonly OfficialBadge[] = ["model", "observation", "reanalysis"];
const route = getRouteApi("/official");

/** The Official mode: every Challenge #14 resource decoded into data, one plain voice each, with its provenance. Picked from a rack of coded strips. */
export function OfficialRecords() {
  const t = useT();
  const { records, current: crown } = useRecords();
  const { value: index, error } = useLoaded(loadOfficialIndex);
  const { record: wanted } = route.useSearch();
  const navigate = route.useNavigate();
  // A related record has no URL of its own: it stays open until the record in the URL changes.
  const [related, setRelated] = useState<{ id: string; forRecord: string | undefined } | null>(null);
  // The list is one Tab stop (audit A10): the strip last focused, or the chosen record; arrows, Home and End move inside.
  const [focused, setFocused] = useState<string | null>(null);
  const rove = useRovingFocus();
  useAnnounceError(error ? t("official.error") : null);
  if (error) return <StatusBadge kind="error">{t("official.error")}</StatusBadge>;
  if (!index) return <StatusBadge kind="loading">{t("official.loading")}</StatusBadge>;
  const selected = index.records.find((r) => r.record === wanted)?.record ?? index.records[0]?.record;
  const current = related && related.forRecord === selected ? related.id : selected;
  const select = (id: string) => {
    setRelated(null);
    void navigate({ search: { record: id }, replace: true });
  };
  const stripOf = (id: string) => records.find((r) => r.action.kind === "official" && r.action.record === id);
  return (
    <section aria-labelledby="official-heading">
      <h2 id="official-heading" className="sr-only">{t("official.heading")}</h2>
      <Cabinet code={crown?.code} title={crown?.title(t)} flush slimVeryShort foldCrown>
        <div className="official-grid grid gap-6">
          <div aria-label={t("official.records")} role="group" onKeyDown={rove} className="official-list space-y-4 pr-1">
            {KIND_ORDER.map((kind) => {
              const rows = index.records.filter((r) => r.badge === kind);
              if (rows.length === 0) return null;
              return (
                <div key={kind} className="space-y-2.5">
                  <h3 className="font-wide text-body">{t(`records.kind.${kind}`)}</h3>
                  <ul className="space-y-2.5 pr-1 pb-1">
                    {rows.map((row) => {
                      const record = stripOf(row.record);
                      return record && (
                        <li key={row.record}>
                          <RecordStrip
                            record={record}
                            chosen={row.record === current}
                            braille={recordBrailleLabel(row)}
                            onClick={() => select(row.record)}
                            roving={{ tabStop: row.record === (focused && index.records.some((r) => r.record === focused) ? focused : selected), onFocus: () => setFocused(row.record) }}
                          />
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
          <div className="official-player min-w-0">{current && <Player key={current} record={current} related={<RelatedRecords value={current ?? ""} onChange={(id) => setRelated({ id, forRecord: selected })} />} />}</div>
        </div>
      </Cabinet>
    </section>
  );
}
