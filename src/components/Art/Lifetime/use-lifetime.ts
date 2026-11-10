"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLoaded } from "@/hooks/use-loaded";
import { lifetimeSong, type LifetimeFile } from "@/lib/art/lifetime/song";
import { playSong, type Scheduled } from "@/lib/art/live/song-player";
import { fetchJson } from "@/lib/data/fetch";
import { ensureAudioAll } from "@/lib/audio-engines";
import { getAnalyser } from "@/lib/audio";
import type { PlayerHandle } from "@/lib/audio/types";
import type { ClimateCellName } from "@/types/data-contract";

export const loadLifetime = () => fetchJson<LifetimeFile>("/data/thenvsnow/lifetime.json");

/** The song for a city and birth year, its player, and the playhead (the note sounding now, on the audio clock). */
export function useLifetime(city: ClimateCellName, born: number) {
  const { value: file } = useLoaded(loadLifetime);
  const parts = useMemo(() => (file ? lifetimeSong(file, city, born) : []), [file, city, born]);
  const [now, setNow] = useState<Scheduled | null>(null);
  const [playing, setPlaying] = useState(false);
  const handle = useRef<PlayerHandle | null>(null);
  const frame = useRef(0);

  const stop = useCallback(() => {
    handle.current?.stop();
    handle.current = null;
    cancelAnimationFrame(frame.current);
    setPlaying(false);
  }, []);

  const play = useCallback(async () => {
    stop();
    await ensureAudioAll();
    const { handle: h, times } = playSong(parts);
    handle.current = h;
    setPlaying(true);
    const tick = () => {
      const clock = getAnalyser()?.context.currentTime ?? 0;
      const current = [...times].reverse().find((s) => s.time <= clock) ?? null;
      setNow(current);
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    void h.done.then(() => {
      if (handle.current === h) stop();
    });
  }, [parts, stop]);

  useEffect(() => stop, [stop, city, born]);
  return { file, parts, play, stop, playing, now };
}
