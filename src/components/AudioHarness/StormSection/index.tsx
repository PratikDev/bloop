import { useId, useState } from "react";
import { ChoiceGroup, type Choice } from "@/components/ChoiceGroup";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { peakFrame, playTimelapse } from "@/lib/audio";
import HarnessSection from "../HarnessSection";
import StepProgress from "../StepProgress";
import { usePlayer } from "../use-player";
import { useStormInput } from "./use-storm-input";

type Fps = "1" | "2" | "4";
const FPS: readonly Choice<Fps>[] = [
  { value: "1", label: "1 fps" },
  { value: "2", label: "2 fps" },
  { value: "4", label: "4 fps" },
];

interface StormSectionProps {
  ready: boolean;
}

/** Phase 6: the storm time-lapse on synthetic or real frames. */
export default function StormSection({ ready }: StormSectionProps) {
  const { playing, start, stop } = usePlayer();
  const { storm, progress, error, loadReal, useSynthetic } = useStormInput();
  const [fps, setFps] = useState<Fps>("2");
  const [loop, setLoop] = useState(false);
  const loopId = useId();
  const { frames } = storm;
  const peak = peakFrame(frames);
  const count = (phase: string) => frames.filter((f) => f.phase === phase).length;
  const frameInfo = (i: number) => {
    const f = frames[i];
    return f ? `${f.phase}${f.mmPerHour ? ` ${f.mmPerHour.toFixed(2)} mm/h` : ""}` : "";
  };

  return (
    <HarnessSection
      title="Storm time-lapse"
      phase={6}
      description="Rain density rises and falls with the frames, snow frames switch to bells, no-data frames are silent with one tick per run, and the peak caption arrives on the heaviest frame. At 2 fps, 48 frames span 23.5 s from first to last step (24 s with the last frame)."
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-sm text-muted-foreground">
          frames: {storm.source === "real" ? "REAL storm (L3's loadSequence + followStorm)" : "SYNTHETIC (made-up)"}
        </span>
        <Button size="sm" variant="outline" disabled={progress !== null} onClick={() => void loadReal()}>
          {progress !== null ? `Loading ${progress}…` : "Load real storm"}
        </Button>
        <Button size="sm" variant="ghost" onClick={useSynthetic}>
          Use synthetic
        </Button>
        {error && <span className="text-sm">Couldn&apos;t load the storm: {error}</span>}
      </div>
      <p className="font-mono text-xs text-muted-foreground">
        {frames.length} frames · liquid {count("liquid")} · frozen {count("frozen")} · dry {count("dry")} · no data{" "}
        {count("nodata")} · peak frame {peak === -1 ? "none" : `${peak + 1} (${frameInfo(peak)})`}
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <ChoiceGroup label="Frames per second" options={FPS} value={fps} onChange={setFps} />
        <div className="flex items-center gap-2">
          <Switch id={loopId} checked={loop} onCheckedChange={setLoop} />
          <Label htmlFor={loopId}>Loop</Label>
        </div>
        <Button variant="outline" disabled={!ready} onClick={() => start("time-lapse", () => playTimelapse(frames, { fps: Number(fps), loop }))}>
          Play time-lapse
        </Button>
        <Button variant="secondary" disabled={!playing} onClick={stop}>
          Skip (stop)
        </Button>
        <span className="font-mono text-sm text-muted-foreground">{playing ? `playing: ${playing}` : "idle"}</span>
      </div>
      <StepProgress player="timelapse" describe={frameInfo} />
    </HarnessSection>
  );
}
