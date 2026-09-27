import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  playEarcon,
  playLegend,
  playLegendForMode,
  playWarmup,
  type EarconId,
  type LegendVoice,
  type PlayerHandle,
  type TrackMode,
} from "@/lib/audio";
import HarnessSection from "./HarnessSection";

const EARCONS: readonly EarconId[] = ["nodata", "whisper", "ping"];
const LEGENDS: readonly LegendVoice[] = ["ocean", "rain", "snow", "heat", "water"];
const MODES: readonly TrackMode[] = ["ocean", "rain", "both"];

interface LegendSectionProps {
  ready: boolean;
}

/** Phase 3: earcons, the audio legend, the warm-up and the short legend on mode change. */
export default function LegendSection({ ready }: LegendSectionProps) {
  const current = useRef<PlayerHandle | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);

  const start = (name: string, play: () => PlayerHandle) => {
    const handle = play();
    current.current = handle;
    setPlaying(name);
    void handle.done.then(() => {
      if (current.current === handle) setPlaying(null);
    });
  };

  return (
    <HarnessSection
      title="Earcons, legend and warm-up"
      phase={3}
      description="Legends play mapping.json's reference points through the real voices, whatever the track mode. Heat and water say their legend isn't available yet (Phase 5). Watch the event log for captions."
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Earcons:</span>
        {EARCONS.map((id) => (
          <Button
            key={id}
            size="sm"
            variant="outline"
            disabled={!ready}
            onClick={() => playEarcon(id, { params: id === "whisper" ? { source: "harness test" } : {} })}
          >
            {id}
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Legend:</span>
        {LEGENDS.map((voice) => (
          <Button key={voice} size="sm" variant="outline" disabled={!ready} onClick={() => start(`legend ${voice}`, () => playLegend(voice))}>
            {voice}
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Legend for mode:</span>
        {MODES.map((mode) => (
          <Button key={mode} size="sm" variant="outline" disabled={!ready} onClick={() => start(`mode ${mode}`, () => playLegendForMode(mode))}>
            {mode}
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" disabled={!ready} onClick={() => start("warm-up", playWarmup)}>
          Warm-up
        </Button>
        <Button variant="secondary" disabled={!playing} onClick={() => current.current?.stop()}>
          Skip (stop this player)
        </Button>
        <span className="font-mono text-sm text-muted-foreground">{playing ? `playing: ${playing}` : "idle"}</span>
      </div>
    </HarnessSection>
  );
}
