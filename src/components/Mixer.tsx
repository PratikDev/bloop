"use client";

import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { Toggle } from "@/components/ui/toggle";
import { LIVE_VOICES, type LiveVoiceId } from "@/lib/audio-adapter/types";
import { useAppState, useT } from "./AppState/use-app-state";

const VOICE_LABEL = { ocean: "track.ocean", rain: "track.rain", snow: "mixer.snow" } as const satisfies Record<
  LiveVoiceId,
  string
>;

const SMALL_TOGGLE = "h-9 min-w-12 rounded-full border border-line px-3 text-small pointer-coarse:h-11 aria-pressed:border-shapla aria-pressed:bg-shapla/15 aria-pressed:text-moon";

/** Volume, mute and solo for each live voice: one row each, aligned in columns. */
export function Mixer({ className }: { className?: string }) {
  const { state, dispatch } = useAppState();
  const t = useT();

  return (
    <div role="group" aria-label={t("mixer.label")} className={cn("grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-x-3 gap-y-3", className)}>
      {LIVE_VOICES.map((voice) => {
        const name = t(VOICE_LABEL[voice]);
        const mix = state.mix[voice];
        return (
          <div key={voice} className="contents">
            <span className="text-body">{name}</span>
            <Slider
              value={[Math.round(mix.volume * 100)]}
              onValueChange={(v) => dispatch({ type: "setVoiceMix", voice, mix: { volume: (Array.isArray(v) ? v[0] : v) / 100 } })}
              thumbLabel={t("mixer.volume", { voice: name })}
            />
            <Toggle
              pressed={mix.muted}
              onPressedChange={(muted) => dispatch({ type: "setVoiceMix", voice, mix: { muted } })}
              aria-label={t("mixer.mute", { voice: name })}
              className={SMALL_TOGGLE}
            >
              {t("mixer.muteShort")}
            </Toggle>
            <Toggle
              pressed={state.solo === voice}
              onPressedChange={(on) => dispatch({ type: "setSolo", solo: on ? voice : null })}
              aria-label={t("mixer.solo", { voice: name })}
              className={SMALL_TOGGLE}
            >
              {t("mixer.soloShort")}
            </Toggle>
          </div>
        );
      })}
    </div>
  );
}
