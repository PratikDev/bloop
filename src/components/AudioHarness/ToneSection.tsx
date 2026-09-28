import { useReducer, useState } from "react";
import { Button } from "@/components/ui/button";
import { isTestTonePlaying, setTestToneFreq, startTestTone, stopTestTone } from "@/lib/audio/dev";
import HarnessSection from "./HarnessSection";
import LabeledSlider from "./LabeledSlider";

interface ToneSectionProps {
  ready: boolean;
}

export default function ToneSection({ ready }: ToneSectionProps) {
  const [freq, setFreq] = useState(440);
  const [, rerender] = useReducer((n: number) => n + 1, 0);
  const playing = ready && isTestTonePlaying();

  const toggle = () => {
    if (playing) stopTestTone();
    else startTestTone(freq);
    rerender();
  };

  return (
    <HarnessSection
      title="Test tone"
      phase={1}
      description="A sine on the ocean channel. It should fade in and out, and glide while you drag, with no clicks or zipper noise."
    >
      <Button className="self-start" variant="outline" disabled={!ready} onClick={toggle}>
        {playing ? "Stop tone" : "Play tone"}
      </Button>
      <LabeledSlider
        label="Frequency"
        value={freq}
        min={220}
        max={880}
        disabled={!ready}
        format={(v) => `${v} Hz`}
        onChange={(v) => {
          setFreq(v);
          setTestToneFreq(v);
        }}
      />
    </HarnessSection>
  );
}
