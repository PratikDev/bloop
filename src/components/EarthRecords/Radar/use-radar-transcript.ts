"use client";

import { useEffect, useState } from "react";
import { ruleText, voiceSpec } from "@/lib/audio/mapping";
import { fetchJson } from "@/lib/data/fetch";
import { loadSst } from "@/lib/data/latest";
import { DATA_PATHS } from "@/lib/data/paths";
import { RADAR_VOICE, type MethodManifest } from "@/lib/earth/radar";
import { radarProvenance } from "@/lib/earth/radar-provenance";
import { bindT } from "@/lib/i18n";
import { ruleTextBn } from "@/lib/i18n/bn/rules";
import { useAppState } from "../../AppState/use-app-state";
import type { AppTranscriptData } from "../AppTranscript";

/** The radar method's transcript: the two rules, the caption, NASA's description and credits. */
export function useRadarTranscript(): { data: AppTranscriptData | null; error: boolean } {
  const { state } = useAppState();
  const lang = state.lang;
  const [data, setData] = useState<AppTranscriptData | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    // t is bound here: useT gives a new function each render, which would restart this load forever.
    const t = bindT(lang);
    Promise.all([fetchJson<MethodManifest>(DATA_PATHS.official("sonification_13786/manifest.json")), loadSst()])
      .then(([m, sst]) => {
        if (cancelled) return;
        const rule = (id: string) => (lang === "bn" ? ruleTextBn(voiceSpec(id)) : ruleText(voiceSpec(id)));
        setData({
          title: t("earth.radar.title"),
          mapping: [t("earth.radar.nasaRule"), rule(RADAR_VOICE), t("earth.radar.bloopRule"), rule("ocean")],
          covers: [t("earth.radar.lead")],
          pattern: [t("earth.radar.caption"), m.description.split("||")[0].trim()],
          trust: [t("earth.radar.credit", { credit: m.credit_line }), m.disclosure, m.licence],
          facts: radarProvenance(t, lang, m, sst.meta),
        });
      })
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [lang]);
  return { data, error };
}
