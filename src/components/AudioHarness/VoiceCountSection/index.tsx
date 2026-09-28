import { ChoiceGroup, type Choice } from "@/components/ChoiceGroup";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { T7_VOICES, type T7Voice } from "@/lib/audio/dev";
import HarnessSection from "../HarnessSection";
import { T7_PASS, T7_TRIALS, useVoiceCountTest } from "./use-voice-count-test";

const COUNTS: readonly Choice<"1" | "2" | "3" | "4">[] = (["1", "2", "3", "4"] as const).map((n) => ({
  value: n,
  label: `${n} voice${n === "1" ? "" : "s"}`,
}));

interface VoiceCountSectionProps {
  ready: boolean;
}

/** Ear test T7: a random set of N voices plays together; which were playing? */
export default function VoiceCountSection({ ready }: VoiceCountSectionProps) {
  const t7 = useVoiceCountTest();

  return (
    <HarnessSection
      title="How many voices at once (T7)"
      phase={8}
      description={`A random set of ocean, rain, water and heat plays together for 6 s. Pick the ones you heard, then submit. Pass: at least ${T7_PASS} of ${T7_TRIALS} right at the chosen count (maxConcurrentVoices). Don't look at the event log while testing.`}
    >
      <ChoiceGroup
        label="Voices at once"
        options={COUNTS}
        value={`${t7.count}` as "1" | "2" | "3" | "4"}
        onChange={(n) => t7.setCount(Number(n))}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" disabled={!ready || t7.done} onClick={t7.play}>
          {t7.target ? "Replay" : "Play next set"}
        </Button>
        <ToggleGroup
          aria-label="Voices you heard"
          multiple
          variant="outline"
          value={t7.guess}
          onValueChange={(v: readonly string[]) => t7.setGuess(T7_VOICES.filter((id): id is T7Voice => v.includes(id)))}
        >
          {T7_VOICES.map((id) => (
            <ToggleGroupItem key={id} value={id} disabled={!t7.target}>
              {id}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <Button variant="outline" disabled={!t7.target || t7.guess.length === 0} onClick={t7.submit}>
          Submit
        </Button>
        <Button variant="ghost" size="sm" onClick={() => t7.restart()}>
          Restart
        </Button>
      </div>
      <p className="font-mono text-sm text-muted-foreground" aria-live="polite">
        {t7.count} at once · {t7.correct}/{t7.answered} correct
        {t7.done ? ` · finished: ${t7.correct >= T7_PASS ? "PASS" : "FAIL"}` : ""}
        {t7.last ? ` · ${t7.last}` : ""}
      </p>
    </HarnessSection>
  );
}
