"use client";

import { useEffect, useMemo, useState } from "react";
import { useFreshness } from "@/hooks/use-freshness";
import { voiceSpec } from "@/lib/audio/mapping";
import { loadOfficialLayer, loadOfficialManifest, loadOfficialValidation, OFFICIAL_DIGITS, PATTERN_ONLY, type OfficialGrid } from "@/lib/data";
import type { GeoData } from "@/lib/geo/load";
import { formatSignificant, formatUtc, type BoundT, type Lang } from "@/lib/i18n";
import { officialProvenance } from "@/lib/provenance/official";
import type { Provenance } from "@/lib/provenance/types";
import { gridExtremes, type GridExtreme } from "@/lib/transcript";
import type { OfficialLayer, OfficialManifest, OfficialValidationFile } from "@/types/data-contract";
import { useAppState, useT } from "../../AppState/use-app-state";
import { loadGeoSoon, placeNamers } from "../../Describe/place-namer";
import { linerNotes } from "../../OfficialRecords/liner-notes";

interface Loaded {
  manifest: OfficialManifest;
  validation: OfficialValidationFile | null;
  grid: OfficialGrid | null;
  geo: GeoData | null;
}

interface OfficialTranscriptData {
  title: string;
  mapping: string[];
  covers: string[];
  pattern: string[];
  moments: string[];
  notes: string[];
  svs: { description: string; ids: string; pages: string[] };
  provenance: Provenance | null;
}

const label = (t: BoundT, l: OfficialLayer) => t("data.text", { text: l.label });
const timeOf = (lang: Lang, l: OfficialLayer, step: number) => l.time_labels?.[step] ?? formatUtc(l.times[step], lang);

function extremeLine(t: BoundT, lang: Lang, geo: GeoData | null, l: OfficialLayer, which: "highest" | "lowest", e: GridExtreme): string {
  const place = placeNamers(geo, lang).name(e) ?? t("place.spoken", e);
  return t(which === "highest" ? "transcript.highest" : "transcript.lowest", { label: label(t, l), value: formatSignificant(e.value, lang, OFFICIAL_DIGITS), unit: l.unit, place, time: timeOf(lang, l, e.step) });
}

async function load(record: string): Promise<Loaded> {
  const [manifest, validation, geo] = await Promise.all([loadOfficialManifest(record), loadOfficialValidation(record).catch(() => null), loadGeoSoon()]);
  const layer = manifest.layers.find((l) => l.id === manifest.play[0]?.map);
  const grid = layer && layer.status !== PATTERN_ONLY && layer.grid.space !== "frame" ? await loadOfficialLayer(record, layer).catch(() => null) : null;
  return { manifest, validation, grid, geo };
}

export function useOfficialTranscript(record: string): { data: OfficialTranscriptData | null; error: boolean } {
  const { state } = useAppState();
  const t = useT();
  const freshness = useFreshness();
  const [loaded, setLoaded] = useState<{ record: string; value: Loaded | null } | null>(null);

  useEffect(() => {
    let cancelled = false;
    load(record).then(
      (value) => !cancelled && setLoaded({ record, value }),
      () => !cancelled && setLoaded({ record, value: null }),
    );
    return () => {
      cancelled = true;
    };
  }, [record]);

  const mine = loaded?.record === record ? loaded : null;
  const data = useMemo(() => {
    const v = mine?.value;
    if (!v) return null;
    const { manifest: m, validation, grid, geo } = v;
    const lang = state.lang;
    const voices = [...new Set(m.play.flatMap((p) => p.channels.map((c) => c.voice)))];
    const ext = grid && gridExtremes(grid);
    const mapLayer = m.layers.find((l) => l.id === m.play[0]?.map) ?? m.layers[0];
    return {
      title: m.app_title,
      mapping: voices.map((id) => t("mapping.rule", { voice: voiceSpec(id) })),
      covers: m.layers.flatMap((l) =>
        l.status === PATTERN_ONLY
          ? [t("transcript.layerPattern", { label: label(t, l) })]
          : l.value_range
            ? [t("transcript.layerRange", { label: label(t, l), min: formatSignificant(l.value_range[0], lang, OFFICIAL_DIGITS), max: formatSignificant(l.value_range[1], lang, OFFICIAL_DIGITS), unit: l.unit })]
            : [],
      ),
      pattern: [...m.layers.flatMap((l) => (l.statement ? [l.statement] : [])), m.disclosure],
      moments: grid && ext ? [extremeLine(t, lang, geo, grid.layer, "highest", ext.max), extremeLine(t, lang, geo, grid.layer, "lowest", ext.min)] : [],
      notes: linerNotes(t, m, validation).filter(Boolean),
      svs: { description: m.description, ids: m.svs_ids.join(", "), pages: m.svs_pages },
      provenance: mapLayer ? officialProvenance({ t, lang, freshness, place: null }, m, mapLayer, validation) : null,
    };
  }, [mine, state.lang, t, freshness]);
  return { data, error: mine !== null && mine.value === null };
}
