"use client";

import { useEffect, useState } from "react";
import { LEGEND_SOUND_SEC, type LiveVoiceId } from "@/lib/audio-adapter/types";
import { captionText } from "@/lib/i18n";
import { legendSoundWord, type SoundWordId } from "@/lib/sound-words";
import { onCaption, type CaptionEvent } from "@/lib/ui-captions";
import { isVoiceUnmuted } from "../AppState/reducer";
import { useAppState } from "../AppState/use-app-state";
import { SoundWord } from "../SoundWord";

const STEP_KEY = "caption.legend";
const STOPPED_KEY = "caption.stopped";

interface LegendStep {
  id: SoundWordId;
  caption: CaptionEvent;
}

/**
 * While a step of this voice's audio legend plays: its sound word, large, beside the plain caption. This is where
 * people learn the words. Its height is kept while nothing plays, so the rule below doesn't jump.
 */
export function LegendSoundWord({ voice }: { voice: LiveVoiceId }) {
  const { state } = useAppState();
  const [step, setStep] = useState<LegendStep | null>(null);

  useEffect(() => {
    let hide: ReturnType<typeof setTimeout> | undefined;
    const off = onCaption((caption) => {
      if (caption.key !== STEP_KEY && caption.key !== STOPPED_KEY) return;
      clearTimeout(hide);
      const id = caption.key === STEP_KEY && caption.params.voice === voice ? legendSoundWord(voice, caption.params.label) : null;
      setStep(id && { id, caption });
      if (id) hide = setTimeout(() => setStep(null), LEGEND_SOUND_SEC * 1000);
    });
    return () => {
      off();
      clearTimeout(hide);
    };
  }, [voice]);

  if (!state.soundWords) return null;
  const heard = step !== null && isVoiceUnmuted(state, voice);
  return (
    <div aria-hidden="true" className="flex min-h-16 min-w-0 items-center gap-4">
      {heard && (
        <>
          <SoundWord id={step.id} size="legend" />
          {state.captions && <p className="text-body text-moon">{captionText(state.lang, step.caption.key, step.caption.params)}</p>}
        </>
      )}
    </div>
  );
}
