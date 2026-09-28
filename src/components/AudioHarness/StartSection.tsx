import { Button } from "@/components/ui/button";
import { ensureAudio, isAudioReady } from "@/lib/audio";
import { getAudioInfo } from "@/lib/audio/dev";
import HarnessSection from "./HarnessSection";

interface StartSectionProps {
  ready: boolean;
}

export default function StartSection({ ready }: StartSectionProps) {
  const info = getAudioInfo();
  // A code change hot-reloads the engine module: the page still says "running", but the new engine never started.
  const stale = ready && !isAudioReady();
  return (
    <HarnessSection
      title="Start"
      phase={1}
      description="Audio can only start from a click or key press. Nothing should sound before this."
    >
      <div className="flex flex-wrap items-center gap-4">
        <Button autoFocus aria-label="Start audio" onClick={() => void ensureAudio()}>
          {ready ? "Audio running" : "Start audio"}
        </Button>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 font-mono text-sm text-muted-foreground">
          <dt>state</dt>
          <dd>{info?.state ?? "not created"}</dd>
          <dt>sample rate</dt>
          <dd>{info ? `${info.sampleRate} Hz` : "—"}</dd>
          <dt>base latency</dt>
          <dd>{info ? `${info.baseLatencyMs.toFixed(1)} ms` : "—"}</dd>
        </dl>
      </div>
      {stale && (
        <p role="alert" className="text-sm">
          The audio engine was reloaded by a code change and is no longer running. Reload the page (F5) and press Start
          again; until then, the play buttons do nothing.
        </p>
      )}
    </HarnessSection>
  );
}
