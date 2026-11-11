"use client";

import { useEffect, useState } from "react";
import { ruleText, voiceSpec } from "@/lib/audio/mapping";
import { modalClass } from "@/lib/earth/class-grid";
import { FIRE_WEATHER_VOICE } from "@/lib/earth/classes";
import { loadArchiveGrids, loadFireData } from "@/lib/earth/fire-data";
import { fireProvenance } from "@/lib/earth/fire-provenance";
import { firmsLine, fwiClassText, satText } from "@/lib/earth/fire-text";
import { boxCentre, dayCount } from "@/lib/earth/firms";
import { nextDay } from "@/lib/earth/fwi";
import { BRIGHTNESS_VOICE, GEIGER_VOICE } from "@/lib/earth/geiger";
import { pilotRows, pilotSummary } from "@/lib/earth/pilot";
import { bindT, formatDay, formatFixed, formatInteger } from "@/lib/i18n";
import { ruleTextBn } from "@/lib/i18n/bn/rules";
import { useAppState } from "../../AppState/use-app-state";
import type { AppTranscriptData } from "../AppTranscript";
import { fireLinerNotes } from "./liner";

const RHO_DECIMALS = 2;

export function useFireTranscript(): { data: AppTranscriptData | null; error: boolean } {
  const { state } = useAppState();
  const lang = state.lang;
  const [data, setData] = useState<AppTranscriptData | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const t = bindT(lang);
    (async () => {
      const d = await loadFireData();
      const archive = await loadArchiveGrids(d);
      const meta = d.fwi.meta;
      const daily = d.daily;
      const rule = (id: string) => (lang === "bn" ? ruleTextBn(voiceSpec(id)) : ruleText(voiceSpec(id)));
      const forDay = nextDay(meta.frame_time_utc.slice(0, 10));
      const source = daily.sources[0];
      const peaks = daily.regions.flatMap((region) => {
        const s = daily.series[`${region}|${source}`];
        if (!s?.days.length) return [];
        const i = s.counts.indexOf(Math.max(...s.counts));
        return [firmsLine(t, lang, daily, { region, source, day: s.days[i], count: dayCount(s, s.days[i]) })];
      });
      const summary = pilotSummary(pilotRows(daily, meta.grid, archive), daily.sources);
      const bd = modalClass(meta.grid, d.fwi.codes, daily.boxes.Bangladesh);
      const reading = { fwiCode: bd ?? 0, forDay, region: daily.regions[0], source, day: forDay, count: null };
      if (cancelled) return;
      setData({
        title: t("earth.fire.title"),
        mapping: [t("earth.fire.lead"), rule(FIRE_WEATHER_VOICE), rule(GEIGER_VOICE), rule(BRIGHTNESS_VOICE), t("earth.fire.brightness")],
        covers: [t("earth.fire.fwiLabel"), t("earth.fire.picture"), t("earth.fire.pixelNote")],
        pattern: [
          ...(bd !== null ? [t("earth.fire.bdNow", { date: formatDay(forDay, lang), cls: fwiClassText(t, meta, bd) })] : []),
          ...peaks,
          t("earth.pilot.heading"),
          ...summary.map((s) =>
            s.rho === null
              ? t("earth.pilot.rhoNone", { sat: satText(daily, s.source), n: formatInteger(s.n, lang) })
              : t("earth.pilot.rho", { sat: satText(daily, s.source), rho: formatFixed(s.rho, lang, RHO_DECIMALS), n: formatInteger(s.n, lang) }),
          ),
          t(summary.some((s) => s.claim === "agreement") ? "earth.pilot.claim" : "earth.pilot.noClaim"),
        ],
        trust: fireLinerNotes(t, d).filter(Boolean),
        facts: fireProvenance(t, lang, d, reading, t("place.latlon", boxCentre(daily.boxes.Bangladesh))),
      });
    })().catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [lang]);
  return { data, error };
}
