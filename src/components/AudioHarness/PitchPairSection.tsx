import { useState } from "react";
import { Button } from "@/components/ui/button";
import { playPitchPair } from "@/lib/audio/dev";
import HarnessSection from "./HarnessSection";

const TRIALS = 10;
const STEP_C = 1;

interface Trial {
  baseC: number;
  secondHigher: boolean;
}

function newTrial(): Trial {
  return { baseC: 5 + Math.random() * 25, secondHigher: Math.random() < 0.5 };
}

interface PitchPairSectionProps {
  ready: boolean;
}

/** Ear test T4: two ocean tones 1 °C apart in random order; is the second higher or lower? */
export default function PitchPairSection({ ready }: PitchPairSectionProps) {
  const [trial, setTrial] = useState<Trial | null>(null);
  const [answered, setAnswered] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [last, setLast] = useState<string | null>(null);
  const done = answered >= TRIALS;

  const play = () => {
    const t = trial ?? newTrial();
    setTrial(t);
    const [a, b] = t.secondHigher ? [t.baseC, t.baseC + STEP_C] : [t.baseC + STEP_C, t.baseC];
    playPitchPair(a, b);
  };

  const answer = (secondHigher: boolean) => {
    if (!trial) return;
    const right = secondHigher === trial.secondHigher;
    setAnswered((n) => n + 1);
    if (right) setCorrect((n) => n + 1);
    setLast(right ? "Correct" : `Wrong: the second was ${trial.secondHigher ? "higher" : "lower"}`);
    setTrial(null);
  };

  const restart = () => {
    setTrial(null);
    setAnswered(0);
    setCorrect(0);
    setLast(null);
  };

  return (
    <HarnessSection
      title="Pitch step test (T4)"
      phase={2}
      description={`Two ocean tones ${STEP_C} °C apart, in random order. Pass: at least 8 of ${TRIALS} right per teammate. Don't look at the ocean readout while testing.`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" disabled={!ready || done} onClick={play}>
          {trial ? "Replay pair" : "Play next pair"}
        </Button>
        <Button variant="outline" disabled={!trial} onClick={() => answer(true)}>
          Second was higher
        </Button>
        <Button variant="outline" disabled={!trial} onClick={() => answer(false)}>
          Second was lower
        </Button>
        <Button variant="ghost" size="sm" onClick={restart}>
          Restart
        </Button>
      </div>
      <p className="font-mono text-sm text-muted-foreground" aria-live="polite">
        {correct}/{answered} correct{done ? ` · finished: ${correct >= 8 ? "PASS" : "FAIL"}` : ""}
        {last ? ` · ${last}` : ""}
      </p>
    </HarnessSection>
  );
}
