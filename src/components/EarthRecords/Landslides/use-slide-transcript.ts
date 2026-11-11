"use client";

import { useEffect, useState } from "react";
import { ruleText, voiceSpec } from "@/lib/audio/mapping";
import { LANDSLIDE_VOICE } from "@/lib/earth/classes";
import { cellsPerClass, loadLandslide, slideSoundText } from "@/lib/earth/landslide";
import { slideProvenance } from "@/lib/earth/landslide-provenance";
import { bindT, formatInteger } from "@/lib/i18n";
import { ruleTextBn } from "@/lib/i18n/bn/rules";
import { useAppState } from "../../AppState/use-app-state";
import type { AppTranscriptData } from "../AppTranscript";
import { slideLinerNotes } from "./liner";

export function useSlideTranscript(): { data: AppTranscriptData | null; error: boolean } {
  const { state } = useAppState();
  const lang = state.lang;
  const [data, setData] = useState<AppTranscriptData | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const t = bindT(lang);
    loadLandslide()
      .then((g) => {
        if (cancelled) return;
        const cells = cellsPerClass(g);
        setData({
          title: t("earth.slide.title"),
          mapping: [t("earth.slide.lead"), lang === "bn" ? ruleTextBn(voiceSpec(LANDSLIDE_VOICE)) : ruleText(voiceSpec(LANDSLIDE_VOICE))],
          covers: [t("earth.slide.label"), t("earth.slide.alt", { date: g.meta.frame_time_utc.slice(0, 10) })],
          pattern: g.meta.classes.map((c, i) => `${t("data.text", { text: c.label })}: ${formatInteger(cells[i] ?? 0, lang)}. ${slideSoundText(t, c.code)}`),
          trust: slideLinerNotes(t, g.meta).filter(Boolean),
          facts: [slideProvenance(t, lang, g.meta, t("hwgt.na"))],
        });
      })
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [lang]);
  return { data, error };
}
