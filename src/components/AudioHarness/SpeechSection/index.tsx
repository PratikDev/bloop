import { useId, useState } from "react";
import { ChoiceGroup, type Choice } from "@/components/ChoiceGroup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { speak, type Lang } from "@/lib/audio";
import HarnessSection from "../HarnessSection";
import DuckingTest from "./DuckingTest";
import { useBusLevel } from "./use-bus-level";
import { useSpeechVoices } from "./use-speech-voices";

const LANGS: readonly Choice<Lang>[] = [
  { value: "en", label: "English" },
  { value: "bn", label: "বাংলা", lang: "bn" },
];

interface SpeechSectionProps {
  ready: boolean;
}

/** Phase 3: speech with ducking, the T2 test, and the device's voice list. */
export default function SpeechSection({ ready }: SpeechSectionProps) {
  const [text, setText] = useState("Twenty-eight point four degrees");
  const [lang, setLang] = useState<Lang>("en");
  const { level, ducked } = useBusLevel(ready);
  const voices = useSpeechVoices();
  const inputId = useId();

  return (
    <HarnessSection
      title="Speech and ducking"
      phase={3}
      description="While speech plays, the live voices dip to the duck level and come back smoothly after. Speaking twice quickly or pressing Esc must never leave them ducked."
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor={inputId}>Text to speak</Label>
        <Input id={inputId} value={text} onChange={(e) => setText(e.target.value)} />
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <ChoiceGroup label="Speech language" options={LANGS} value={lang} onChange={setLang} />
        <Button variant="outline" disabled={!ready} onClick={() => void speak(text, lang)}>
          Speak
        </Button>
      </div>
      <p className="font-mono text-sm text-muted-foreground" aria-live="off">
        sonification bus {level.toFixed(2)} · {ducked ? "ducked" : "normal"}
      </p>
      <DuckingTest ready={ready} />
      <details className="text-sm">
        <summary className="cursor-pointer">Speech voices on this device ({voices.length})</summary>
        <ul className="mt-2 max-h-48 overflow-y-auto font-mono text-xs text-muted-foreground">
          {voices.map((v) => (
            <li key={`${v.name}-${v.lang}`}>
              {v.lang} · {v.name} · {v.localService ? "local" : "network"}
            </li>
          ))}
        </ul>
      </details>
    </HarnessSection>
  );
}
