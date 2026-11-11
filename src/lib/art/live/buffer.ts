import { getCtx, getGraph } from "@/lib/audio/context";
import { track } from "@/lib/audio/sources";
import type { PlayerHandle } from "@/lib/audio/types";

export function playSamples(channels: readonly Float32Array[], sampleRate: number): PlayerHandle {
  const ctx = getCtx();
  const buffer = new AudioBuffer({ length: channels[0].length, sampleRate, numberOfChannels: channels.length });
  channels.forEach((c, i) => buffer.copyToChannel(Float32Array.from(c), i));
  const src = track(new AudioBufferSourceNode(ctx, { buffer }));
  src.connect(getGraph().sonification);
  const done = new Promise<void>((resolve) => src.addEventListener("ended", () => resolve(), { once: true }));
  src.start();
  return {
    stop() {
      try {
        src.stop();
      } catch {
        // already stopped
      }
    },
    done,
  };
}
