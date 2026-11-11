"use client";

import type { MessageKey } from "@/lib/i18n";
import { BRAILLE_LINES, CHANNELS, SPEECH_MODES, VERBOSITIES, type AccessChoices, type BrailleLines, type Channels, type SpeechMode, type Verbosity } from "../AppState/access";
import { useAppState, useT } from "../AppState/use-app-state";
import { ChoiceGroup } from "../ChoiceGroup";

// Each option's label (exhaustive: a value without a string doesn't compile).
const SPEECH_LABEL = {
  screenReader: "access.speech.screenReader",
  voice: "access.speech.voice",
  off: "access.speech.off",
} as const satisfies Record<SpeechMode, MessageKey>;
const VERBOSITY_LABEL = {
  brief: "access.verbosity.brief",
  standard: "access.verbosity.standard",
  detailed: "access.verbosity.detailed",
} as const satisfies Record<Verbosity, MessageKey>;
const CHANNELS_LABEL = {
  both: "access.channels.both",
  text: "access.channels.text",
  sound: "access.channels.sound",
} as const satisfies Record<Channels, MessageKey>;
const BRAILLE_LABEL = {
  full: "access.braille.full",
  short: "access.braille.short",
} as const satisfies Record<BrailleLines, MessageKey>;

/** Speech (screen reader / Bloop's voice / off), detail, what each step sends (step 1), and what a braille display
 *  gets: full lines or short ones (plan item 12). */
export function AccessSettings() {
  const { state, dispatch } = useAppState();
  const t = useT();
  const set = (patch: Partial<AccessChoices>) => dispatch({ type: "setAccess", patch });
  const common = { showLabel: true, className: "w-full", itemClassName: "flex-1" } as const;
  return (
    <div className="space-y-3" data-testid="access-settings">
      <ChoiceGroup
        {...common}
        label={t("access.speech")}
        options={SPEECH_MODES.map((value) => ({ value, label: t(SPEECH_LABEL[value]) }))}
        value={state.speechMode}
        onChange={(speechMode) => set({ speechMode })}
      />
      <p className="px-1 text-small text-haze">{t("access.speech.note")}</p>
      <ChoiceGroup
        {...common}
        label={t("access.verbosity")}
        options={VERBOSITIES.map((value) => ({ value, label: t(VERBOSITY_LABEL[value]) }))}
        value={state.verbosity}
        onChange={(verbosity) => set({ verbosity })}
      />
      <ChoiceGroup
        {...common}
        label={t("access.channels")}
        options={CHANNELS.map((value) => ({ value, label: t(CHANNELS_LABEL[value]) }))}
        value={state.channels}
        onChange={(channels) => set({ channels })}
      />
      <ChoiceGroup
        {...common}
        label={t("access.braille")}
        options={BRAILLE_LINES.map((value) => ({ value, label: t(BRAILLE_LABEL[value]) }))}
        value={state.brailleLines}
        onChange={(brailleLines) => set({ brailleLines })}
      />
      <p className="px-1 text-small text-haze">{t("access.braille.note")}</p>
    </div>
  );
}
