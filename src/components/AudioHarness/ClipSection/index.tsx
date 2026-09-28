import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { playClip, preloadClips } from "@/lib/audio";
import { clipStatus } from "@/lib/audio/dev";
import HarnessSection from "../HarnessSection";
import { useBusLevel } from "../use-bus-level";
import { testClipUrl } from "./test-clip";

const DEFAULT_URL = "/audio/narration_en/opening.mp3";

interface ClipSectionProps {
  ready: boolean;
}

/** Phase 8: recorded narration through the narration bus, ducking the sonification. */
export default function ClipSection({ ready }: ClipSectionProps) {
  const [url, setUrl] = useState(DEFAULT_URL);
  const [status, setStatus] = useState("not loaded");
  const [playing, setPlaying] = useState(0); // calls not yet resolved (a replaced clip resolves early)
  const { level, ducked } = useBusLevel(ready);
  const inputId = useId();

  const preload = async (target: string) => {
    setStatus("loading…");
    await preloadClips([target]);
    setStatus(clipStatus(target) ?? "not loaded");
  };

  const play = async (target: string) => {
    setPlaying((n) => n + 1);
    await playClip(target);
    setPlaying((n) => n - 1);
    setStatus(clipStatus(target) ?? "not loaded");
  };

  return (
    <HarnessSection
      title="Recorded narration"
      phase={8}
      description="Start ocean + rain in the Live voices card first. While a clip plays, they dip to the duck level and come back after; a new clip replaces the old one; Esc stops it and never leaves them ducked."
    >
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" disabled={!ready} onClick={() => void play(testClipUrl())}>
          Play test clip (generated, 4 s)
        </Button>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={inputId}>Clip URL (L4&apos;s clips: /audio/narration_en/… or /audio/narration_bn/…)</Label>
        <Input id={inputId} value={url} onChange={(e) => setUrl(e.target.value)} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={() => void preload(url)}>
          Preload
        </Button>
        <Button variant="outline" disabled={!ready} onClick={() => void play(url)}>
          Play
        </Button>
      </div>
      <p className="font-mono text-sm text-muted-foreground" aria-live="off">
        clip {status} · {playing > 0 ? "playing" : "idle"} · sonification bus {level.toFixed(2)} ·{" "}
        {ducked ? "ducked" : "normal"}
      </p>
    </HarnessSection>
  );
}
