import { useState } from "react";
import { Button } from "@/components/ui/button";
import { playOpening, playSweep } from "@/lib/audio";
import HarnessSection from "../HarnessSection";
import LabeledSlider from "../LabeledSlider";
import StepProgress from "../StepProgress";
import MotifControls from "./MotifControls";
import { syntheticOpening, syntheticSweep } from "./synthetic";

interface SequenceSectionProps {
  ready: boolean;
}

/** Phase 4: the sweep (with a step-event playhead), the motif and the opening. */
export default function SequenceSection({ ready }: SequenceSectionProps) {
  const [stepMs, setStepMs] = useState(80);
  const disabled = !ready;

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
        <StepProgress player="sweep" />
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
