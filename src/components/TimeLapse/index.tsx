"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePlayhead } from "@/hooks/use-playhead";
import { audio } from "@/lib/audio-adapter";
import type { PlayerHandle, SweepPoint } from "@/lib/audio-adapter/types";
import { DATA_PATHS, followStorm, loadSequence, type Sequence } from "@/lib/data";
import { formatUtc } from "@/lib/i18n";
import { loadImage } from "@/lib/load-image";
import { useAnnounce } from "../Announcer/use-announcer";
import { useAppState, useT } from "../AppState/use-app-state";
import { TimeLapseContext, type TimeLapseStatus, type TimeLapseValue } from "./use-time-lapse";

// Player name agreed with L2 (contract-proposals B5): step index = frame index.
const PLAYER = "timelapse";
// Frame rate of the plan's C4 ("about 2 frames/s"); also used by the silent visual clock.
const FPS = 2;

interface Loaded {
  seq: Sequence;
  path: SweepPoint[];
  images: HTMLImageElement[];
}

/**
 * Storm time-lapse (plan C4): the last ~48 half-hourly rain frames, with the
 * cursor following the heaviest rain near Bangladesh. With sound on, the audio
 * clock drives the frames; with sound off, a visual clock does, so the
 * time-lapse still works for people who can't use sound.
 */
export function TimeLapseProvider({ children }: { children: ReactNode }) {
  const { state } = useAppState();
  const announce = useAnnounce();
  const t = useT();
  const [status, setStatus] = useState<TimeLapseStatus>("idle");
  const [progress, setProgress] = useState<{ loaded: number; total: number } | null>(null);
  const [data, setData] = useState<Loaded | null>(null);
  const [visualIndex, setVisualIndex] = useState<number | null>(null);
  const [withSound, setWithSound] = useState(false);
  const handle = useRef<PlayerHandle | null>(null);
  const head = usePlayhead(PLAYER);

  const load = useCallback(async (): Promise<Loaded> => {
    // Grids and images count together: 2 files per frame.
    let done = 0;
    const tick = (total: number) => setProgress({ loaded: ++done, total });
    const seq = await loadSequence((_, total) => tick(total * 2));
    const images = await Promise.all(
      seq.frames.map(async (f) => {
        const img = await loadImage(DATA_PATHS.sequenceFile(f.ref.png));
        tick(seq.frames.length * 2);
        return img;
      }),
    );
    return { seq, path: followStorm(seq), images };
  }, []);

  const finish = useCallback(() => {
    handle.current = null;
    setVisualIndex(null);
    setStatus((s) => (s === "playing" ? "idle" : s));
  }, []);

  const start = useCallback(async () => {
    if (status === "loading" || status === "playing") return;
    setStatus("loading");
    let loaded = data;
    try {
      loaded ??= await load();
    } catch {
      setStatus("error");
      return;
    }
    setData(loaded);
    setProgress(null);
    setStatus("playing");
    const frames = loaded.seq.frames;
    announce(
      t("timelapse.announceStart", {
        count: frames.length,
        from: formatUtc(frames[0].ref.time_utc, state.lang),
        to: formatUtc(frames[frames.length - 1].ref.time_utc, state.lang),
      }),
    );
    setWithSound(state.soundOn);
    if (state.soundOn) {
      const h = audio.playTimelapse(loaded.path, { fps: FPS });
      handle.current = h;
      void h.done.then(() => {
        if (handle.current === h) finish();
      });
    } else {
      setVisualIndex(0);
    }
  }, [status, data, load, announce, t, state.lang, state.soundOn, finish]);

  const stop = useCallback(() => {
    if (handle.current) handle.current.stop();
    else finish();
  }, [finish]);

  // Visual clock for sound-off playback (visuals only; sound is never timed this way).
  const total = data?.seq.frames.length ?? 0;
  useEffect(() => {
    if (status !== "playing" || withSound) return;
    let i = 0;
    const id = setInterval(() => {
      i++;
      if (i >= total) {
        clearInterval(id);
        finish();
      } else {
        setVisualIndex(i);
      }
    }, 1000 / FPS);
    return () => clearInterval(id);
  }, [status, withSound, total, finish]);

  // Leaving Explore stops the time-lapse.
  useEffect(() => {
    if (state.mode !== "explore") stop();
  }, [state.mode, stop]);

  const value = useMemo<TimeLapseValue>(() => {
    const index = status !== "playing" || !data ? null : withSound ? (head?.index ?? 0) : visualIndex;
    const current =
      index === null || !data || !data.seq.frames[index]
        ? null
        : {
            index,
            total: data.seq.frames.length,
            timeUtc: data.seq.frames[index].ref.time_utc,
            point: data.path[index],
            image: data.images[index] ?? null,
          };
    return { status, progress, current, start: () => void start(), stop };
  }, [status, progress, data, withSound, head, visualIndex, start, stop]);

  return <TimeLapseContext.Provider value={value}>{children}</TimeLapseContext.Provider>;
}
