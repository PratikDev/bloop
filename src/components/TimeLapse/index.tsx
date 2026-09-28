"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePlayhead } from "@/hooks/use-playhead";
import { peakFrame } from "@/lib/audio";
import { audio } from "@/lib/audio-adapter";
import type { PlayerHandle, SweepPoint } from "@/lib/audio-adapter/types";
import { DATA_PATHS, followStorm, loadSequence, windowStart, type Sequence } from "@/lib/data";
import { formatUtc } from "@/lib/i18n";
import { loadImage } from "@/lib/load-image";
import { useAnnounce } from "../Announcer/use-announcer";
import { useAppState, useT } from "../AppState/use-app-state";
import { TimeLapseContext, type TimeLapseRun, type TimeLapseStatus, type TimeLapseValue } from "./use-time-lapse";

// Player name agreed with L2 (contract-proposals B5): step index = frame index.
const PLAYER = "timelapse";
// Frame rate of the plan's C4 ("about 2 frames/s"); also used by the silent visual clock.
const FPS = 2;
const NOT_RUN: TimeLapseRun = { finished: false, peak: null, last: null };

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
  // Which of the loaded frames this run plays: all of them, or a window around the peak (Story Mode).
  const [played, setPlayed] = useState({ first: 0, count: 0 });
  const handle = useRef<PlayerHandle | null>(null);
  // Resolves the promise start() returned, once the run ends.
  const settle = useRef<((finished: boolean) => void) | null>(null);
  // Bumped by stop(), so a stop during loading cancels the run that was loading.
  const runId = useRef(0);
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

  const finish = useCallback((finished: boolean) => {
    handle.current = null;
    setVisualIndex(null);
    setStatus((s) => (s === "playing" ? "idle" : s));
    settle.current?.(finished);
    settle.current = null;
  }, []);

  const start = useCallback(async (options?: { framesAroundPeak?: number }): Promise<TimeLapseRun> => {
    if (status === "loading" || status === "playing") return NOT_RUN;
    setStatus("loading");
    const id = runId.current;
    let loaded = data;
    if (!loaded) announce(t("timelapse.loadingStart"));
    try {
      loaded ??= await load();
    } catch {
      setStatus("error");
      return NOT_RUN;
    }
    if (id !== runId.current) {
      setData(loaded);
      setStatus("idle");
      return NOT_RUN;
    }
    setData(loaded);
    setProgress(null);
    setStatus("playing");
    const all = loaded.seq.frames;
    // The same peak rule picks the window's centre and, below, the peak inside it.
    const size = Math.min(options?.framesAroundPeak ?? all.length, all.length);
    const first = windowStart(Math.max(0, peakFrame(loaded.path)), size, all.length);
    const frames = all.slice(first, first + size);
    const path = loaded.path.slice(first, first + size);
    setPlayed({ first, count: frames.length });
    announce(
      t("timelapse.announceStart", {
        count: frames.length,
        from: formatUtc(frames[0].ref.time_utc, state.lang),
        to: formatUtc(frames[frames.length - 1].ref.time_utc, state.lang),
      }),
    );
    setWithSound(state.soundOn);
    const p = peakFrame(path);
    const peak = p === -1 ? null : { point: path[p], timeUtc: frames[p].ref.time_utc };
    const ended = new Promise<boolean>((resolve) => {
      settle.current = resolve;
    });
    if (state.soundOn) {
      const h = audio.playTimelapse(path, { fps: FPS });
      handle.current = h;
      // stop() clears the handle first, so only a natural end gets here.
      void h.done.then(() => {
        if (handle.current === h) finish(true);
      });
    } else {
      setVisualIndex(0);
    }
    // "last" is where the storm is at the newest frame, even when a window ending earlier was played.
    return { finished: await ended, peak, last: loaded.path[loaded.path.length - 1] ?? null };
  }, [status, data, load, announce, t, state.lang, state.soundOn, finish]);

  const stop = useCallback(() => {
    runId.current++;
    const h = handle.current;
    handle.current = null;
    h?.stop();
    finish(false);
  }, [finish]);

  // Visual clock for sound-off playback (visuals only; sound is never timed this way).
  const total = played.count;
  useEffect(() => {
    if (status !== "playing" || withSound) return;
    let i = 0;
    const id = setInterval(() => {
      i++;
      if (i >= total) {
        clearInterval(id);
        finish(true);
      } else {
        setVisualIndex(i);
      }
    }, 1000 / FPS);
    return () => clearInterval(id);
  }, [status, withSound, total, finish]);

  // Leaving a mode stops the time-lapse (Story Mode starts its own).
  useEffect(() => () => stop(), [state.mode, stop]);

  const value = useMemo<TimeLapseValue>(() => {
    const index = status !== "playing" || !data ? null : withSound ? (head?.index ?? 0) : visualIndex;
    const at = index === null ? -1 : played.first + index; // position in the loaded frames
    const current =
      index === null || !data || !data.seq.frames[at]
        ? null
        : {
            index,
            total: played.count,
            timeUtc: data.seq.frames[at].ref.time_utc,
            point: data.path[at],
            image: data.images[at] ?? null,
          };
    return { status, progress, current, start, stop };
  }, [status, progress, data, withSound, head, visualIndex, played, start, stop]);

  return <TimeLapseContext.Provider value={value}>{children}</TimeLapseContext.Provider>;
}
