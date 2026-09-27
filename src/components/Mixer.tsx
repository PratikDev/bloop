"use client";

import { cn } from "cn";
import { Slider } from "@/components/ui/slider";
import { Toggle } from "@/components/ui/toggle";
import { LIVE_VOICES, type LiveVoiceId } from "@/lib/audio-adapter/types";
import { useAppState, useT } from "./AppState/use-app-state";

const VOICE_LABEL = { ocean: "track.ocean", rain: "track.rain", snow: "mixer.snow" } as const satisfies Record<
  LiveVoiceId,
  string
>;

const SMALL_TOGGLE = "h-9 min-w-11 px-2 text-small aria-pressed:bg-tide";

/** Volume, mute and solo for each live voice. */
export function Mixer({ className }: { className?: string }) {
  const { state, dispatch } = useAppState();
  const t = useT();

  return (
    <div role="group" aria-label={t("mixer.label")} className={cn("flex flex-wrap items-center gap-x-5 gap-y-2", className)}>
      {LIVE_VOICES.map((voice) => {
        const name = t(VOICE_LABEL[voice]);
        const mix = state.mix[voice];
        return (
          <div key={voice} className="flex items-center gap-2">
            <span className="w-12 text-body">{name}</span>
            <div className="w-24 shrink-0">
              <Slider
                value={[Math.round(mix.volume * 100)]}
                onValueChange={(v) => dispatch({ type: "setVoiceMix", voice, mix: { volume: (Array.isArray(v) ? v[0] : v) / 100 } })}
                thumbLabel={t("mixer.volume", { voice: name })}
              />
            </div>
            <Toggle
              variant="outline"
              pressed={mix.muted}
              onPressedChange={(muted) => dispatch({ type: "setVoiceMix", voice, mix: { muted } })}
              aria-label={t("mixer.mute", { voice: name })}
              className={SMALL_TOGGLE}
            >
              {t("mixer.muteShort")}
            </Toggle>
            <Toggle
              variant="outline"
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
