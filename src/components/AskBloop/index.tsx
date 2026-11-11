"use client";

import { Microphone } from "@phosphor-icons/react";
import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { speechRecognitionAvailable } from "@/lib/ask-bloop/voice";
import { FLAGS } from "@/lib/flags";
import { LANGS, type Lang } from "@/lib/i18n/types";
import { useT } from "../AppState/use-app-state";
import { ChoiceGroup } from "../ChoiceGroup";
import { starterExamples, useAskBloop } from "./use-ask-bloop";
import { usePushToTalk } from "./use-push-to-talk";
import { useStoredChoice } from "./use-stored-choice";

const SHORTCUT = ["on", "off"] as const;

/**
 * Ask Bloop: a typed box with a visible label (always), push-to-talk where the browser can listen (its own flag), the
 * last answer as text, five starters, and its settings. Answers go through the app's speech mode. It lives in Listen's
 * sheet, so the map's keys never reach the box.
 */
export function AskBloop() {
  const t = useT();
  const inputId = useId();
  const hintId = useId();
  const [text, setText] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const bloop = useAskBloop();
  const [shortcut, setShortcut] = useStoredChoice("bloop.ask.altK", SHORTCUT, "on");
  const voice = FLAGS.askBloopVoice && typeof window !== "undefined" && speechRecognitionAvailable();
  const talk = usePushToTalk(
    bloop.inputLang,
    voice,
    shortcut === "on",
    (heard) => {
      // What was heard goes in the box (it can be corrected), and is asked at once.
      setText(heard);
      void bloop.ask(heard);
    },
    setText,
  );

  // Opening puts focus in the box: a magnifier or screen reader lands where the typing goes.
  useEffect(() => input.current?.focus(), []);

  if (!FLAGS.askBloop) return null;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void bloop.ask(text);
  };
  const onKeyDown = (e: KeyboardEvent) => {
    // The map's keys never reach the box; Escape ends listening first.
    e.stopPropagation();
    if (e.key === "Escape" && talk.listening) {
      e.preventDefault();
      talk.cancel();
    }
  };
  const holdKey = (e: KeyboardEvent, down: boolean) => {
    if (e.key !== " " && e.key !== "Enter") return;
    e.preventDefault();
    if (down && !e.repeat) void talk.start();
    if (!down) talk.stop();
  };

  return (
    <section aria-label={t("ask.title")} data-testid="ask-bloop" className="space-y-3 pt-3" onKeyDown={onKeyDown}>
      <form onSubmit={submit} className="space-y-1">
        <label htmlFor={inputId} className="block font-medium">
          {t("ask.input")}
        </label>
        <div className="flex flex-wrap gap-2">
          <Input
            ref={input}
            id={inputId}
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-describedby={hintId}
            autoComplete="off"
            lang={bloop.inputLang}
            data-testid="ask-input"
            className="h-11 min-w-0 flex-1 basis-56 text-body"
          />
          <Button type="submit" className="h-11 rounded-full px-5" disabled={bloop.busy}>
            {t("ask.submit")}
          </Button>
          {voice && (
            <Button
              type="button"
              variant="outline"
              className="h-11 gap-2 rounded-full"
              aria-pressed={talk.listening}
              aria-keyshortcuts={shortcut === "on" ? "Alt+K" : undefined}
              onPointerDown={() => void talk.start()}
              onPointerUp={talk.stop}
              onPointerLeave={talk.stop}
              onKeyDown={(e) => holdKey(e, true)}
              onKeyUp={(e) => holdKey(e, false)}
            >
              <Microphone aria-hidden="true" className="size-5" />
              {talk.listening ? t("ask.listening") : shortcut === "on" ? t("ask.speakKey") : t("ask.speak")}
            </Button>
          )}
        </div>
        <p id={hintId} className="text-small text-haze">
          {t("ask.hint")}
        </p>
      </form>

      <div>
        <h3 className="text-small text-haze">{t("ask.answer")}</h3>
        {/* Text only: the status region (or Bloop's voice) already said it once. */}
        <p data-testid="ask-answer" className="text-lead">
          {bloop.last ?? t("ask.none")}
        </p>
      </div>

      <div>
        <h3 className="text-small text-haze">{t("ask.starters")}</h3>
        <ul className="flex flex-wrap gap-2">
          {starterExamples(bloop.inputLang).map((example) => (
            <li key={example}>
              <Button
                type="button"
                variant="ghost"
                lang={bloop.inputLang}
                className="h-11 rounded-full px-3 ring-1 ring-glass-edge"
                onClick={() => {
                  setText(example);
                  void bloop.ask(example);
                  input.current?.focus();
                }}
              >
                {example}
              </Button>
            </li>
          ))}
        </ul>
      </div>

      <details className="space-y-2">
        <summary className="min-h-11 cursor-pointer py-2">{t("ask.settings")}</summary>
        <ChoiceGroup<Lang>
          label={t("ask.inputLanguage")}
          showLabel
          value={bloop.inputLang}
          onChange={bloop.setInputLang}
          options={LANGS.map((l) => ({ value: l, label: t(`ask.inputLanguage.${l}`), lang: l }))}
        />
        {voice && (
          <ChoiceGroup<(typeof SHORTCUT)[number]>
            label={t("ask.speakKey")}
            showLabel
            value={shortcut}
            onChange={setShortcut}
            options={SHORTCUT.map((v) => ({ value: v, label: t(v === "on" ? "ask.shortcut.on" : "ask.shortcut.off") }))}
          />
        )}
        <p className="text-small text-haze">{voice ? t(talk.mode === "on-device" ? "ask.voiceLocal" : "ask.voiceCloud") : t("ask.voiceUnavailable")}</p>
        <p className="text-small text-haze">{t("ask.settingsNote")}</p>
      </details>
    </section>
  );
}
