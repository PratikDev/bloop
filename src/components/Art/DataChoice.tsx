"use client";

import { useArtSettings } from "@/hooks/use-art-settings";
import { dataChoice } from "@/lib/art/choices";
import { recordCategory } from "@/lib/art/live/record";
import { dialStop } from "@/lib/art/settings";
import { voiceSpec } from "@/lib/audio/mapping";
import { FLAGS } from "@/lib/flags";
import { useT } from "../AppState/use-app-state";

/** Two short lists for one sound: what comes from the data, and what is our artistic choice (now, at this dial). */
export function DataChoice({ voiceId }: { voiceId: string }) {
  const t = useT();
  const [art] = useArtSettings();
  if (!FLAGS.artChoices) return null;
  const c = dataChoice(t, voiceSpec(voiceId), recordCategory(voiceId), {
    orchestra: FLAGS.artOrchestra && art.style === "orchestra",
    stop: dialStop(art),
    playMode: art.context?.playMode ?? "single",
  });
  return (
    <dl className="grid gap-x-2 gap-y-1 text-small sm:grid-cols-[auto_1fr]" data-testid="data-choice" data-voice={voiceId}>
      <dt className="text-haze">{t("choices.fromData")}</dt>
      <dd data-list="data">{c.data.join("; ")}</dd>
      <dt className="text-haze">{t("choices.ourChoice")}</dt>
      <dd data-list="choice">{c.choice.join("; ")}</dd>
    </dl>
  );
}
