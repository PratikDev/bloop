"use client";

import { useEffect, useState } from "react";
import { audio } from "@/lib/audio-adapter";
import { audio as jukebox } from "@/lib/audio-jukebox";
import { BEATS, COMPARE_VOICE, compareAt, defaultMonths, layerYears, type CompareLayer, type CompareResult } from "@/lib/compare";
import { loadGlobalLayer, type GlobalLayer } from "@/lib/data";
import { formatFixed, formatMonth, type BoundT, type Lang } from "@/lib/i18n";
import { useAppState, useT } from "../../AppState/use-app-state";
import { useCommands } from "../../Commands/use-commands";
import { compareShort } from "@/a11y/shortForms";

/** Decimals as the files store them (scale 100 → two, scale 10 → one). */
const DECIMALS: Record<CompareLayer, number> = { heat: 2, rain: 2, water: 1 };
const LABEL = { heat: "compare.layer.heat", rain: "compare.layer.rain", water: "compare.layer.water" } as const;
const UNIT = { heat: "compare.unit.heat", rain: "compare.unit.rain", water: "compare.unit.water" } as const;
export const LAYER_LABEL = LABEL;

/** What a comparison says: both values, then the difference (all slots from the file). */
export function compareText(r: CompareResult, t: BoundT, lang: Lang): string {
  const record = t(LABEL[r.layer]);
  const place = t("place.spoken", r.cell);
  if (r.a.value === null || r.b.value === null || r.diff === null) return t("compare.none", { record, place });
  const unit = t(UNIT[r.layer]);
  const n = (v: number) => formatFixed(v, lang, DECIMALS[r.layer]);
  const head = t("compare.said", { record, place, a: formatMonth(r.a.month, lang), aValue: n(r.a.value), b: formatMonth(r.b.month, lang), bValue: n(r.b.value), unit });
  const same = n(Math.abs(r.diff)) === n(0);
  const tail = same ? t("compare.same") : t(r.diff > 0 ? "compare.higher" : "compare.lower", { diff: n(Math.abs(r.diff)), unit });
  return `${head} ${tail}`;
}

export type LayerState = { status: "loading" } | { status: "error" } | { status: "ready"; layer: GlobalLayer };

/** Compare two dates: the chosen layer (loaded on first use), its months, and run. */
export function useCompare(open: boolean) {
  const { state } = useAppState();
  const commands = useCommands();
  const t = useT();
  const [name, setName] = useState<CompareLayer>("heat");
  const [loaded, setLoaded] = useState<{ name: CompareLayer; state: LayerState }>({ name, state: { status: "loading" } });
  const [months, setMonths] = useState<{ a: string; b: string } | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    loadGlobalLayer(name).then(
      (layer) => {
        if (cancelled) return;
        setLoaded({ name, state: { status: "ready", layer } });
        setMonths(defaultMonths(layer));
      },
      () => !cancelled && setLoaded({ name, state: { status: "error" } }),
    );
    return () => {
      cancelled = true;
    };
  }, [open, name]);

  const layer = loaded.name === name ? loaded.state : ({ status: "loading" } as const);
  const years = layer.status === "ready" ? layerYears(layer.layer) : [];
  const monthsAvailable = layer.status === "ready" ? layer.layer.months : [];

  const run = () => {
    if (layer.status !== "ready" || !months) return;
    const result = compareAt(layer.layer, name, state.cursor, months.a, months.b);
    void commands
      .say((t, lang) => compareText(result, t, lang), null, (_t, lang, degree) => compareShort(lang, degree, result))
      .then(() => {
        if (!state.soundOn || result.a.value === null || result.b.value === null) return;
        // The live voices step aside, as for proof in unison (src/lib/audio-engines.ts).
        audio.silenceLive();
        if (BEATS[name]) {
          jukebox.playPair({
            rule: COMPARE_VOICE[name],
            a: result.a.value,
            b: result.b.value,
            caption: (beats) => ({ key: "caption.compare.pair", params: { beats: formatFixed(beats, state.lang, 1) } }),
          });
        } else {
          const side = (label: string, v: number) => ({ label, values: [v], voice: "monsoon" as const });
          audio.playCompare(side(result.a.month, result.a.value), side(result.b.month, result.b.value), "sequential");
        }
      });
    commands.note(compareText(result, t, state.lang), [layer.layer.meta.dataset]);
  };

  return { name, setName, layer, months, setMonths, years, monthsAvailable, run };
}
