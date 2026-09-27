import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { playOpening, playSweep } from "@/lib/audio";
import HarnessSection from "../HarnessSection";
import LabeledSlider from "../LabeledSlider";
import MotifControls from "./MotifControls";
import { syntheticOpening, syntheticSweep } from "./synthetic";
import { useStepPlayhead } from "./use-step-playhead";

interface SequenceSectionProps {
  ready: boolean;
}

/** Phase 4: the sweep (with a step-event playhead), the motif and the opening. */
export default function SequenceSection({ ready }: SequenceSectionProps) {
  const [stepMs, setStepMs] = useState(80);
  const head = useStepPlayhead("sweep");
  const disabled = !ready;
  const pct = head.total > 0 ? ((head.index + 1) / head.total) * 100 : 0;

  return (
    <HarnessSection
      title="Sweep, motif and opening"
      phase={4}
      description="Synthetic sweep: 60 points, ocean 30 → 5 °C, panning west → east, rain getting heavier, no data at every 15th point (tick). The bar moves only from step events, shown when the audio clock reaches them."
    >
      <fieldset className="flex flex-col gap-3" disabled={disabled}>
        <legend className="mb-2 font-medium">Sweep</legend>
        <LabeledSlider label="Step length" value={stepMs} min={40} max={200} step={10} disabled={disabled} format={(v) => `${v} ms`} onChange={setStepMs} />
        <Button className="self-start" variant="outline" disabled={disabled} onClick={() => playSweep(syntheticSweep(), { stepMs })}>
          Play synthetic sweep
        </Button>
        <Progress value={pct} aria-label="Sweep playhead" />
        <p className="font-mono text-sm text-muted-foreground">
          point {head.index + 1}/{head.total} · step events {head.events} · max display lag {head.maxLagMs.toFixed(0)} ms
        </p>
      </fieldset>
      <MotifControls disabled={disabled} />
      <fieldset className="flex flex-col gap-3" disabled={disabled}>
        <legend className="mb-2 font-medium">Opening</legend>
        <Button className="self-start" variant="outline" disabled={disabled} onClick={() => playOpening(syntheticOpening())}>
          Play opening (10 s)
        </Button>
      </fieldset>
    </HarnessSection>
  );
}
