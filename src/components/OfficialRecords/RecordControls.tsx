"use client";

import { Button } from "@/components/ui/button";
import { brailleLabel } from "@/a11y/aria";
import { audio } from "@/lib/audio-jukebox";
import type { OfficialPlayOption } from "@/types/data-contract";
import { useAppState, useT } from "../AppState/use-app-state";
import { ChoiceGroup } from "../ChoiceGroup";
import { Scrubber } from "../Scenes/SceneShell/Scrubber";
import type { OfficialRecordState } from "./use-official-record";

const VIEW_KEYS = { global: "official.view.global", box: "official.view.box" } as const;

/** The record's one coral key: play or pause it. */
export function PlayRecordButton({ rec }: { rec: OfficialRecordState }) {
  const { state } = useAppState();
  const t = useT();
  async function toggle() {
    if (!rec.playing && state.soundOn) await audio.ensureAudio();
    rec.setPlaying(!rec.playing);
  }
  return (
    <Button data-needs-sound onClick={toggle} disabled={!rec.ready} className="key h-11 min-w-24 rounded-lg bg-shapla text-body text-moon hover:bg-shapla" {...brailleLabel(t(rec.playing ? "braille.bl.pause" : "braille.bl.play"))}>
      {t(rec.playing ? "official.pause" : "official.play")}
    </Button>
  );
}

/** Layer and area choice (from the manifest's play options), speak the value, and the time scrubber. */
export function RecordControls({ rec, timeText, readingText }: { rec: OfficialRecordState; timeText: string; readingText: string }) {
  const { state } = useAppState();
  const t = useT();
  const { manifest, option } = rec;
  if (!manifest || !option) return null;
  const groups = [...new Map(manifest.play.map((o) => [o.label, o])).values()];
  const views = [...new Set(manifest.play.filter((o) => o.label === option.label).map((o) => o.view))];
  const pick = (label: string, view: OfficialPlayOption["view"]) => {
    const next = manifest.play.find((o) => o.label === label && o.view === view) ?? manifest.play.find((o) => o.label === label);
    if (next) rec.setOption(next.id);
  };

  return (
    <div className="space-y-3">
      {groups.length > 1 && (
        <ChoiceGroup label={t("official.layer")} value={option.label} onChange={(l) => pick(l, option.view)}
          options={groups.map((o) => ({ value: o.label, label: o.label }))} className="flex-wrap" />
      )}
      {views.length > 1 && (
        <ChoiceGroup label={t("official.view")} value={option.view} onChange={(v) => pick(option.label, v)}
          options={views.map((v) => ({ value: v, label: t(VIEW_KEYS[v]) }))} />
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Button data-needs-sound variant="outline" className="h-11" disabled={!rec.ready} onClick={() => audio.speak(readingText, state.lang)}
          {...brailleLabel(t("braille.bl.speak"))}>
          {t("official.speak")}
        </Button>
      </div>
      <Scrubber label={t("official.time")} index={rec.step} count={rec.steps} onChange={rec.setStep}
        valueText={t("official.timeValue", { time: timeText, step: rec.step + 1, total: rec.steps })} />
    </div>
  );
}
