"use client";

import { useEffect, useState } from "react";
import { ruleText, voiceSpec } from "@/lib/audio/mapping";
import { lightsProvenance } from "@/lib/earth/lights-provenance";
import { LIGHTS_VOICE, lightsSteps, lightsStepLine, loadNightLights } from "@/lib/earth/nightlights";
import { bindT } from "@/lib/i18n";
import { ruleTextBn } from "@/lib/i18n/bn/rules";
import { useAppState } from "../../AppState/use-app-state";
import type { AppTranscriptData } from "../AppTranscript";
import { lightsLinerNotes } from "./liner";

export function useLightsTranscript(): { data: AppTranscriptData | null; error: boolean } {
  const { state } = useAppState();
  const lang = state.lang;
  const [data, setData] = useState<AppTranscriptData | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const t = bindT(lang);
    loadNightLights()
      .then((file) => {
        if (cancelled) return;
        const cities = Object.keys(file.cities);
        setData({
          title: t("earth.lights.title"),
          mapping: [t("earth.lights.lead"), lang === "bn" ? ruleTextBn(voiceSpec(LIGHTS_VOICE)) : ruleText(voiceSpec(LIGHTS_VOICE))],
          covers: [t("earth.lights.label"), t("earth.lights.events")],
          pattern: cities.flatMap((c) => lightsSteps(file.cities[c]).map((s) => lightsStepLine(t, lang, file, c, s))),
          trust: lightsLinerNotes(t, file).filter(Boolean),
          facts: cities.map((c) => lightsProvenance(t, lang, file, c)),
        });
      })
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [lang]);
  return { data, error };
}
