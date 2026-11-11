"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { beginDuck, ensureAudio, playLegend, type PlayerHandle } from "@/lib/audio";
import { listen, recognitionMode, speechRecognitionAvailable, type Listening, type RecognitionMode } from "@/lib/ask-bloop/voice";
import { downloadBlob } from "@/lib/download";
import type { Lang } from "@/lib/i18n/types";
import { ChoiceGroup } from "../ChoiceGroup";
import { prompts, scores } from "./prompts";

type Condition = "headphones" | "speakers";

interface Row {
  browser: string;
  os: string;
  language: Lang;
  condition: Condition;
  recognition: RecognitionMode;
  prompt: string;
  transcript: string;
  parsed: string;
  correct: "yes" | "no";
  latencyMs: number;
}

const CSV_COLUMNS: readonly (keyof Row)[] = ["browser", "os", "language", "condition", "recognition", "prompt", "transcript", "parsed", "correct", "latencyMs"];
const csvCell = (v: string | number) => `"${String(v).replace(/"/gu, '""')}"`;

/**
 * Ask Bloop's speech recognition gate test (docs/voice/GATE_TEST.md): one prompt at a time, press and hold
 * Speak, read it, release; scored by what the parser makes of the transcript. A dev tool: English only on screen.
 */
export function VoiceGate() {
  const [lang, setLang] = useState<Lang>("en");
  const [condition, setCondition] = useState<Condition>("headphones");
  const [mode, setMode] = useState<RecognitionMode>("unavailable");
  const [index, setIndex] = useState(0);
  const [rows, setRows] = useState<Row[]>([]);
  const [heard, setHeard] = useState("");
  const [listening, setListening] = useState(false);
  const session = useRef<{ listening: Listening; release: () => void; sound: PlayerHandle | null; t0: number } | null>(null);
  const list = useMemo(() => prompts(lang), [lang]);
  const prompt = list[index] ?? null;
  const available = typeof window !== "undefined" && speechRecognitionAvailable();

  useEffect(() => {
    void recognitionMode(lang).then(setMode);
  }, [lang]);

  const start = async () => {
    if (!prompt || session.current) return;
    setHeard("");
    setListening(true);
    let sound: PlayerHandle | null = null;
    if (condition === "speakers") {
      await ensureAudio();
      sound = playLegend("ocean");
    }
    const release = beginDuck();
    const l = listen(lang, setHeard, mode === "on-device");
    session.current = { listening: l, release, sound, t0: performance.now() };
    const result = await l.done;
    const s = session.current;
    session.current = null;
    s?.release();
    s?.sound?.stop();
    setListening(false);
    if (!s || result.kind === "error") return;
    const { parsed, correct } = scores(result.text, prompt.expected);
    setRows((r) => [
      ...r,
      {
        browser: navigator.userAgent,
        os: navigator.platform,
        language: lang,
        condition,
        recognition: mode,
        prompt: prompt.text,
        transcript: result.text,
        parsed: parsed ? JSON.stringify(parsed) : "",
        correct: correct ? "yes" : "no",
        latencyMs: Math.round(performance.now() - s.t0),
      },
    ]);
    setIndex((i) => i + 1);
  };
  const stop = () => session.current?.listening.stop();
  const holdKey = (e: KeyboardEvent, down: boolean) => {
    if (e.key !== " " && e.key !== "Enter") return;
    e.preventDefault();
    if (down && !e.repeat) void start();
    if (!down) stop();
  };

  const done = rows.filter((r) => r.language === lang && r.condition === condition);
  const correct = done.filter((r) => r.correct === "yes").length;
  const csv = () => [CSV_COLUMNS.join(","), ...rows.map((r) => CSV_COLUMNS.map((c) => csvCell(r[c])).join(","))].join("\n");

  return (
    <main className="mx-auto max-w-2xl space-y-5 p-6 text-body text-moon">
      <h1 className="font-serif text-headline">Voice gate test</h1>
      <p className="text-haze">Press and hold Speak, read the prompt aloud, release. Scored by meaning (the parser), not spelling.</p>
      {!available && <p role="status">This browser has no speech recognition. Use Chrome on desktop.</p>}
      <ChoiceGroup<Lang> label="Language" showLabel value={lang} onChange={(l) => { setLang(l); setIndex(0); }} options={[{ value: "en", label: "English" }, { value: "bn", label: "Bangla", lang: "bn" }]} />
      <ChoiceGroup<Condition> label="Condition" showLabel value={condition} onChange={setCondition} options={[{ value: "headphones", label: "Headphones" }, { value: "speakers", label: "Speakers (Bloop playing)" }]} />
      <p>Recognition: {mode === "on-device" ? "on this device" : mode === "cloud" ? "the browser's speech service" : "not available"}</p>
      {prompt ? (
        <section aria-labelledby="gate-prompt" className="space-y-3 rounded-plate bg-dusk p-4">
          <h2 id="gate-prompt" className="text-small text-haze">
            Prompt {index + 1} of {list.length}
          </h2>
          <p lang={lang} className="font-serif text-title">
            {prompt.text}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="lg" className="h-11" disabled={!available} aria-pressed={listening} onPointerDown={() => void start()} onPointerUp={stop} onPointerLeave={stop} onKeyDown={(e) => holdKey(e, true)} onKeyUp={(e) => holdKey(e, false)}>
              {listening ? "Listening. Release to stop." : "Speak (hold)"}
            </Button>
            <Button size="lg" variant="outline" className="h-11" onClick={() => setIndex((i) => i + 1)}>
              Skip
            </Button>
          </div>
          <p aria-live="polite">{heard ? `Heard: ${heard}` : ""}</p>
        </section>
      ) : (
        <p role="status">All prompts done for this language and condition.</p>
      )}
      <p>
        {lang}, {condition}: {correct} of {done.length} correct{done.length ? ` (${Math.round((100 * correct) / done.length)}%)` : ""}. Gate: at least 80% with headphones.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" className="h-11" disabled={!rows.length} onClick={() => downloadBlob(new Blob([csv()], { type: "text/csv" }), "voice-gate.csv")}>
          Download CSV
        </Button>
        <Button variant="outline" className="h-11" disabled={!rows.length} onClick={() => downloadBlob(new Blob([JSON.stringify(rows, null, 1)], { type: "application/json" }), "voice-gate.json")}>
          Download JSON
        </Button>
      </div>
    </main>
  );
}
