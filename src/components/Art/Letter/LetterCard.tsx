"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { letterFileName, letterLines, letterText, type LetterInput } from "@/lib/art/letter/letter";
import { artProvenance } from "@/lib/art/provenance";
import { downloadBlob } from "@/lib/download";
import { audio } from "@/lib/audio-adapter";
import { useAppState, useT } from "../../AppState/use-app-state";
import { useCommands } from "../../Commands/use-commands";
import { HowWeGotThis } from "../../HowWeGotThis";

/**
 * The letter: a dated card built only from data. Opening it says it (the status region or Bloop's voice) and, with
 * sound on, plays the value once on its own data voice, then holds it under the card; no music swells. Save the letter
 * gives a UTF-8 .txt wrapped to a braille display's 40 cells.
 */
export function LetterCard({ letter, lon, onClose }: { letter: LetterInput; lon: number; onClose?: () => void }) {
  const { state } = useAppState();
  const t = useT();
  const commands = useCommands();
  const lines = letterLines(t, state.lang, letter);
  const said = useRef(false);
  const r = letter.reading;
  useEffect(() => {
    if (said.current) return;
    said.current = true;
    void commands.say((bt, lang) => letterLines(bt, lang, letter).join(" "));
    if (!state.soundOn) return;
    if (r.kind === "ocean") audio.setOcean(r.valueC, lon);
    if (r.kind === "rain") audio.setRain(r.mmPerHour, "liquid", lon);
  }, [commands, letter, lon, r, state.soundOn]);
  useEffect(() => () => audio.silenceLive(), []);
  const save = () => downloadBlob(new Blob([letterText(t, state.lang, letter)], { type: "text/plain;charset=utf-8" }), letterFileName(letter.date));
  const facts = [
    artProvenance({
      subject: t("letter.hwgt.subject"),
      method: t("letter.hwgt.method"),
      dataset: letter.source,
      link: letter.link,
      window: letter.date,
      place: letter.place,
      scripts: ["src/lib/art/letter/letter.ts", "src/components/Art/Letter/use-listen-letter.ts"],
      test: "src/lib/art/letter/letter.test.ts",
    }),
  ];
  return (
    <article data-provenance-group="" className="surface-plate space-y-2 rounded-plate p-4" aria-labelledby="letter-title" data-testid="letter-card" data-kind={r.kind}>
      <h2 id="letter-title" className="font-serif text-title">{t("letter.title")}</h2>
      <p className="font-serif text-lead text-moon" data-testid="letter-text">{lines.join(" ")}</p>
      <p className="text-small text-haze">{t("letter.note")}</p>
      <div className="flex flex-wrap items-center gap-2">
        <Button className="h-11" onClick={save}>
          {t("letter.save")}
        </Button>
        {onClose && (
          <Button variant="ghost" className="h-11" onClick={onClose}>
            {t("letter.close")}
          </Button>
        )}
        <HowWeGotThis facts={facts} />
      </div>
    </article>
  );
}
