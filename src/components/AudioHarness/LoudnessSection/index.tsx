import { useState } from "react";
import { ChoiceGroup, type Choice } from "@/components/ChoiceGroup";
import { Button } from "@/components/ui/button";
import HarnessSection from "../HarnessSection";
import LabeledSlider from "../LabeledSlider";
import { compensationDb, T3_FREQS, useLoudnessTest, type T3Answer, type T3Device } from "./use-loudness-test";

const DEVICES: readonly Choice<T3Device>[] = [
  { value: "headphones", label: "Headphones" },
  { value: "phone", label: "Phone speaker" },
];

const ANSWERS: readonly { value: T3Answer; label: string }[] = [
  ...T3_FREQS.map((f) => ({ value: `${f}` as T3Answer, label: `${f} Hz loudest` })),
  { value: "equal", label: "All equal" },
];

const formatDb = (db: number) => `${db > 0 ? "+" : db < 0 ? "−" : ""}${Math.abs(db).toFixed(1)} dB`;

interface LoudnessSectionProps {
  ready: boolean;
}

/** Ear test T3: tune the loudness-compensation exponent until 220 / 440 / 880 Hz sound equally loud. */
export default function LoudnessSection({ ready }: LoudnessSectionProps) {
  const t3 = useLoudnessTest();
  const [device, setDevice] = useState<T3Device>("headphones");

  return (
    <HarnessSection
      title="Loudness balance (T3)"
      phase={8}
      description="The ocean voice at 220, 440 and 880 Hz, at its real level with the compensation below. Pass: at the chosen exponent every teammate answers 'All equal' on headphones and on a phone speaker. The slider changes this page only; copy the chosen value into public/mapping.json."
    >
      <LabeledSlider
        label="Compensation exponent (0 = off)"
        value={t3.exponent}
        min={0}
        max={1}
        step={0.05}
        format={(k) => k.toFixed(2)}
        onChange={t3.setExponent}
      />
      <p className="font-mono text-sm text-muted-foreground" aria-live="off">
        {T3_FREQS.map((f) => `${f} Hz ${formatDb(compensationDb(f, t3.exponent))}`).join(" · ")}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" disabled={!ready || t3.playing} onClick={() => t3.play(T3_FREQS)}>
          {t3.playing ? "Playing…" : "Play 220 → 440 → 880 Hz"}
        </Button>
        {T3_FREQS.map((f) => (
          <Button key={f} variant="ghost" size="sm" disabled={!ready || t3.playing} onClick={() => t3.play([f])}>
            {f} Hz
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <ChoiceGroup label="Listening on" options={DEVICES} value={device} onChange={setDevice} />
        {ANSWERS.map((a) => (
          <Button key={a.value} variant="outline" size="sm" onClick={() => t3.record(device, a.value)}>
            {a.label}
          </Button>
        ))}
        <Button variant="ghost" size="sm" disabled={t3.results.length === 0} onClick={t3.clear}>
          Clear
        </Button>
      </div>
      {t3.results.length > 0 && (
        <ol className="font-mono text-xs text-muted-foreground">
          {t3.results.map((r, i) => (
            <li key={i}>
              {i + 1}. k={r.exponent.toFixed(2)} · {r.device} · {r.answer === "equal" ? "all equal" : `${r.answer} Hz loudest`}
            </li>
          ))}
        </ol>
      )}
    </HarnessSection>
  );
}
