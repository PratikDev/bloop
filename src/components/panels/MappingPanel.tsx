"use client";

import { Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MAPPING, ruleText } from "@/lib/audio/mapping";
import { audio } from "@/lib/audio-adapter";
import type { LegendVoice } from "@/lib/audio-adapter/types";
import type { Lang } from "@/lib/i18n";
import type { VoiceSpec } from "@/types/data-contract";
import { useAppState, useT } from "../AppState/use-app-state";

const LEGEND_VOICES: readonly string[] = ["ocean", "rain", "snow"] satisfies LegendVoice[];

const isLegendVoice = (id: string): id is LegendVoice => LEGEND_VOICES.includes(id);

/** mapping.json marks untranslated Bangla with "TODO:"; show English until it's done. */
function voiceLabel(v: VoiceSpec, lang: Lang): string {
  return lang === "bn" && !v.label.bn.startsWith("TODO") ? v.label.bn : v.label.en;
}

const STATUS_KEY = {
  verified: "mapping.status.verified",
  context: "mapping.status.context",
  designOnly: "mapping.status.designOnly",
} as const;

/** Every value → sound rule, rendered from public/mapping.json (L2's file). */
export function MappingPanel() {
  const { state } = useAppState();
  const t = useT();
  const live = MAPPING.voices.filter((v) => v.group === "live" || v.group === "earcon");

  return (
    <div className="space-y-6">
      <p className="text-haze">{t("mapping.intro")}</p>

      <section className="space-y-4">
        <h3 className="text-lead font-medium">{t("mapping.live")}</h3>
        {live.map((v) => (
          <article key={v.id} className="space-y-1.5 border-t border-tide pt-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h4 className="font-medium">{voiceLabel(v, state.lang)}</h4>
              <span className="text-small text-haze">{t(STATUS_KEY[v.status])}</span>
            </div>
            <p>{ruleText(v)}</p>
            <p className="text-small text-haze">{v.sound.timbre}</p>
            <p className="text-small text-haze">
              {t("mapping.silence")}: {v.silence}
            </p>
            {v.note && <p className="text-small text-haze">{v.note}</p>}
            {v.designChoice && <p className="text-small text-moon">{t("mapping.designChoice")}</p>}
            {isLegendVoice(v.id) && (
              <Button variant="secondary" onClick={() => isLegendVoice(v.id) && audio.playLegend(v.id)} className="mt-1 h-10 gap-2 pointer-coarse:h-11">
                <Volume2 aria-hidden="true" />
                {t("mapping.hearLegend")}
              </Button>
            )}
          </article>
        ))}
      </section>

      <section className="space-y-2">
        <h3 className="text-lead font-medium">{t("mapping.global")}</h3>
        <ul className="list-disc space-y-1 pl-5 text-haze">
          {MAPPING.global.rules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
