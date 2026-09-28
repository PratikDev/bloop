import { useRef, useState } from "react";
import type { PlayerHandle } from "@/lib/audio";

/** Tracks the harness's current player: its name while it plays, and Skip (stop). */
export function usePlayer() {
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

  return { playing, start, stop: () => current.current?.stop() };
}
