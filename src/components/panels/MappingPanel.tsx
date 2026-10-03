"use client";

import { SpeakerHigh } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { MAPPING } from "@/lib/audio/mapping";
import { audio } from "@/lib/audio-adapter";
import type { LegendVoice } from "@/lib/audio-adapter/types";
import type { VoiceSpec } from "@/types/data-contract";
import { useT } from "../AppState/use-app-state";

const LEGEND_VOICES: readonly string[] = ["ocean", "rain", "snow"] satisfies LegendVoice[];

const isLegendVoice = (id: string): id is LegendVoice => LEGEND_VOICES.includes(id);

const STATUS_KEY = {
  verified: "mapping.status.verified",
  context: "mapping.status.context",
  designOnly: "mapping.status.designOnly",
} as const;

/** The voices that sound somewhere in the app; "context" ones have a written rule but no sound yet. */
export const PLAYED_VOICES = MAPPING.voices.filter((v) => v.group !== "context");

type Group = VoiceSpec["group"];

/** How we know lists every rule, grouped by where it sounds; the Listen Inspector only the map's. */
const SECTIONS: { title: "mapping.live" | "mapping.thenNow" | "mapping.notPlayed"; groups: readonly Group[] }[] = [
  { title: "mapping.live", groups: ["live", "earcon"] },
  { title: "mapping.thenNow", groups: ["thenNow"] },
  { title: "mapping.notPlayed", groups: ["context"] },
];

/** One voice's rule. mapping.json's own text is English; t("data.text") shows it in the page's language. */
function VoiceRule({ v }: { v: VoiceSpec }) {
  const t = useT();
  return (
    <article className="space-y-1.5 border-t border-tide pt-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="font-medium">{t("mapping.voiceLabel", { voice: v })}</h4>
        <span className="text-small text-haze">{t(STATUS_KEY[v.status])}</span>
      </div>
      <p>{t("mapping.rule", { voice: v })}</p>
      <p className="text-small text-haze">{t("data.text", { text: v.sound.timbre })}</p>
      <p className="text-small text-haze">
        {t("mapping.silence")}: {t("data.text", { text: v.silence })}
      </p>
      {v.note && <p className="text-small text-haze">{t("data.text", { text: v.note })}</p>}
      {v.designChoice && <p className="text-small text-moon">{t("mapping.designChoice")}</p>}
      {isLegendVoice(v.id) && (
        <Button variant="secondary" onClick={() => isLegendVoice(v.id) && audio.playLegend(v.id)} className="mt-1 h-10 gap-2 pointer-coarse:h-11">
          <SpeakerHigh aria-hidden="true" className="size-4.5" />
          {t("mapping.hearLegend")}
        </Button>
      )}
    </article>
  );
}

/** Value → sound rules, rendered from public/mapping.json (L2's file): the map's (`live`), or every one (`all`). */
export function MappingPanel({ scope = "live" }: { scope?: "live" | "all" }) {
  const t = useT();
  const sections = scope === "all" ? SECTIONS : SECTIONS.slice(0, 1);

  return (
    <div className="space-y-6">
      <p className="text-haze">{t("mapping.intro")}</p>

      {sections.map(({ title, groups }) => (
        <section key={title} className="space-y-4">
          <h3 className="text-lead font-medium">{t(title)}</h3>
          {MAPPING.voices
            .filter((v) => groups.includes(v.group))
            .map((v) => (
              <VoiceRule key={v.id} v={v} />
            ))}
        </section>
      ))}

      <section className="space-y-2">
        <h3 className="text-lead font-medium">{t("mapping.global")}</h3>
        <ul className="list-disc space-y-1 pl-5 text-haze">
          {MAPPING.global.rules.map((rule) => (
            <li key={rule}>{t("data.text", { text: rule })}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
