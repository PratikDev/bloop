"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useFreshness } from "@/hooks/use-freshness";
import { audio } from "@/lib/audio-adapter";
import { digitsTrace } from "@/lib/ask-bloop/digits";
import type { Intent } from "@/lib/ask-bloop/intents";
import { llmIntent } from "@/lib/ask-bloop/llm/client";
import { parseUtterance } from "@/lib/ask-bloop/parser";
import { REGISTRY, STARTERS } from "@/lib/ask-bloop/registry";
import type { LatLon } from "@/lib/data";
import { FLAGS } from "@/lib/flags";
import { loadGeo } from "@/lib/geo/load";
import type { Lang } from "@/lib/i18n";
import { LANGS } from "@/lib/i18n/types";
import { readAt } from "@/lib/reading";
import { useAppState, useT } from "../AppState/use-app-state";
import { useCommands } from "../Commands/use-commands";
import { useLiveData } from "../LiveData/use-live-data";
import { useTimeLapse } from "../TimeLapse/use-time-lapse";
import { runAction } from "./actions";
import { plain, type Answer, type AskContext } from "./context";
import { runQuestion } from "./questions";
import { useStoredChoice } from "./use-stored-choice";

/** How long a value's tone sounds before the needle's own sound comes back (design choice). */
const TONE_MS = 1500;

/** The starters (spec §5.6), in a language: the first example of each. */
export const starterExamples = (lang: Lang) => STARTERS.map((n) => REGISTRY[n].examples[lang][0]);

/**
 * Ask Bloop's router (spec §4): what was typed or heard → the parser (then, only with its flag, the AI route) → the
 * registry's handler → an answer through the app's speech mode, after the digit-provenance check, then the value's
 * tone. Keeps the last answer for "repeat" and "more".
 */
export function useAskBloop() {
  const { state, dispatch } = useAppState();
  const t = useT();
  const commands = useCommands();
  const { fields } = useLiveData();
  const freshness = useFreshness();
  const { stepFrame } = useTimeLapse();
  const [inputLang, setInputLang] = useStoredChoice<Lang>("bloop.ask.inputLang", LANGS, state.lang);
  const [last, setLast] = useState<{ text: string; answer: Answer } | null>(null);
  const [busy, setBusy] = useState(false);
  const toneTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cursor = useRef(state.cursor);
  useEffect(() => {
    cursor.current = state.cursor;
  }, [state.cursor]);
  useEffect(() => () => (toneTimer.current ? clearTimeout(toneTimer.current) : undefined), []);

  /** A value's tone, on the live voices at that point, then the needle's own again (the mixer's mute holds). */
  const playTone = useCallback(
    (at: LatLon) => {
      if (!fields || !state.soundOn) return;
      const set = (p: LatLon) => {
        const r = readAt(fields, p);
        if (state.track !== "rain") audio.setOcean(r.ocean.valueC, p.lon);
        if (state.track !== "ocean") audio.setRain(r.rain.mmPerHour, r.rain.phase, p.lon);
      };
      set(at);
      if (toneTimer.current) clearTimeout(toneTimer.current);
      toneTimer.current = setTimeout(() => set(cursor.current), TONE_MS);
    },
    [fields, state.soundOn, state.track],
  );

  const deliver = useCallback(
    (text: string, answer: Answer) => {
      // Digit provenance (§6.4): a number that isn't one of the engine's results never reaches the reader.
      const said = answer.line(t, state.lang);
      const safe = digitsTrace(said, answer.sources(state.lang)) ? answer : plain((tl) => tl("ask.clarify"));
      setLast({ text, answer: safe });
      if (safe.silent) return;
      void commands.say(safe.line, null, safe.short).then(() => safe.tone && playTone(safe.tone));
    },
    [t, state.lang, commands, playTone],
  );

  const run = useCallback(
    async (intent: Intent): Promise<Answer | null> => {
      const ctx: AskContext = { t, lang: state.lang, state, dispatch, commands, fields, freshness, stepFrame, gazetteer: () => loadGeo().then((g) => g.gazetteer), setInputLang };
      switch (intent.name) {
        case "help":
          return plain((tl, lang) => tl("ask.help", { examples: starterExamples(lang).join("; ") }));
        case "repeat":
          return last ? last.answer : plain((tl) => tl("ask.nothingToRepeat"));
        case "more":
          // One level more for the last answer: its record's provenance line after it.
          if (!last) return plain((tl) => tl("ask.nothingToRepeat"));
          {
            const about = await runQuestion(ctx, { name: "about_record", record: null });
            return { ...last.answer, line: (tl, lang) => `${last.answer.line(tl, lang)} ${about.line(tl, lang)}`, sources: (lang) => [...last.answer.sources(lang), ...about.sources(lang)] };
          }
        case "cancel":
          window.speechSynthesis?.cancel();
          return plain((tl) => tl("ask.cancelled"));
        case "value_here":
        case "value_at":
        case "extreme_in":
        case "compare_dates":
        case "what_am_i_hearing":
        case "about_record":
        case "how_reliable":
          return runQuestion(ctx, intent);
        default:
          return runAction(ctx, intent);
      }
    },
    [t, state, dispatch, commands, fields, freshness, stepFrame, setInputLang, last],
  );

  const ask = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text) return;
      setBusy(true);
      try {
        let intent = parseUtterance(text)?.intent ?? null;
        if (!intent && FLAGS.askBloopLlm) intent = await llmIntent(text, state.track);
        const answer = intent ? await run(intent) : plain((tl) => tl("ask.clarify"));
        if (answer) deliver(text, answer);
      } finally {
        setBusy(false);
      }
    },
    [run, deliver, state.track],
  );

  return { ask, busy, last: last ? last.answer.line(t, state.lang) : null, inputLang, setInputLang };
}
