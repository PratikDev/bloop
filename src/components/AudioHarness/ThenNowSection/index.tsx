import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { playCompare, playSeries, playThenNow, type ThenNowPart } from "@/lib/audio";
import { setBassHarmonics } from "@/lib/audio/dev";
import HarnessSection from "../HarnessSection";
import StepProgress from "../StepProgress";
import { usePlayer } from "../use-player";
import InputSummary from "./InputSummary";
import { heatSides, useDemoInput } from "./use-demo-input";

const PARTS: readonly ThenNowPart[] = ["heat", "monsoon", "water", "all"];

interface ThenNowSectionProps {
  ready: boolean;
}

/** Phase 5: Then vs Now, the Comparison Player and playSeries, on synthetic or real demo input. */
export default function ThenNowSection({ ready }: ThenNowSectionProps) {
  const { playing, start, stop } = usePlayer();
  const { demo, error, loading, loadReal, useSynthetic } = useDemoInput();
  const [harmonics, setHarmonics] = useState(true);
  const harmonicsId = useId();
  const disabled = !ready;
  const { input, series } = demo;
  const [heatA, heatB] = heatSides(input);
  const yearOf = (i: number) => String([...input.heat.A.years, ...input.heat.B.years][i] ?? "");
  const monthOf = (i: number) => input.water.months[i] ?? "";

  return (
    <HarnessSection
      title="Then vs Now and comparison"
      phase={5}
      description="Heat: window B higher, rough/detuned years above 1.5 °C. Monsoon: B slightly sparser (not wetter). Water: the bass sinks; missing months are silent with a caption. Captions come from the input as-is."
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-sm text-muted-foreground">
          input: {demo.source === "real" ? "REAL demo (L3's buildThenNowInput)" : "SYNTHETIC (made-up numbers)"}
        </span>
        <Button size="sm" variant="outline" disabled={loading} onClick={() => void loadReal()}>
          {loading ? "Loading…" : "Load real demo"}
        </Button>
        <Button size="sm" variant="ghost" onClick={useSynthetic}>
          Use synthetic
        </Button>
        {error && <span className="text-sm">Couldn&apos;t load the demo: {error}</span>}
      </div>
      <InputSummary input={input} />
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Then vs Now:</span>
        {PARTS.map((part) => (
          <Button key={part} size="sm" variant="outline" disabled={disabled} onClick={() => start(`thenNow ${part}`, () => playThenNow(input, part))}>
            {part}
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Heat A vs B:</span>
        <Button size="sm" variant="outline" disabled={disabled} onClick={() => start("compare", () => playCompare(heatA, heatB, "sequential"))}>
          sequential
        </Button>
        <Button size="sm" variant="outline" disabled={disabled} onClick={() => start("compare split", () => playCompare(heatA, heatB, "split"))}>
          split (headphones)
        </Button>
        <Button size="sm" variant="outline" disabled={disabled} onClick={() => start("series", () => playSeries(series, { player: "history" }))}>
          series (&quot;history&quot;)
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Button variant="secondary" disabled={!playing} onClick={stop}>
          Skip (stop this player)
        </Button>
        <span className="font-mono text-sm text-muted-foreground">{playing ? `playing: ${playing}` : "idle"}</span>
        <div className="flex items-center gap-2">
          <Switch
            id={harmonicsId}
            checked={harmonics}
            onCheckedChange={(on) => {
              setHarmonics(on);
              setBassHarmonics(on);
            }}
          />
          <Label htmlFor={harmonicsId}>Water bass harmonics (T5)</Label>
        </div>
      </div>
      <StepProgress player="thenNow.heat" describe={yearOf} />
      <StepProgress player="thenNow.monsoon" describe={yearOf} />
      <StepProgress player="thenNow.water" describe={monthOf} />
      <StepProgress player="compare" />
      <StepProgress player="compare.split" />
      <StepProgress player="history" />
    </HarnessSection>
  );
}
