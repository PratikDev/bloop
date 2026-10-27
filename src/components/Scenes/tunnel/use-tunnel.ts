"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { audio } from "@/lib/audio-adapter";
import type { PlayerHandle, TunnelYear } from "@/lib/audio-adapter/types";
import type { Rgb } from "../colormaps";
import { createFrameBus } from "../frame-bus";
import type { SceneBuildHost, SceneHandle } from "../types";
import { createTunnelScene, type TunnelFrame, type TunnelScene } from "./tunnel-scene";

/** Fly-through speeds in years per second (design choice); the default is 1.5. */
export const YEARS_PER_SEC = [0.5, 1, 1.5, 2, 3] as const;
const DEFAULT_SPEED = 2;
/** After the last ring, the tunnel lands back on the turntable. */
const LAND_AFTER_MS = 2500;
const EASE_PER_SEC = 5;

export interface TunnelControl {
  bus: ReturnType<typeof createFrameBus<TunnelFrame>>;
  build(host: SceneBuildHost): SceneHandle;
  /** The year index the camera is at (fractional while flying). */
  position(): number;
  playing: boolean;
  speedIndex: number;
  setSpeedIndex(i: number): void;
  toggle(): void;
  /** Jump (or step) to a year index; pauses the flight. */
  goTo(index: number): void;
  ended: boolean;
}

export function useTunnel(o: {
  rows: readonly TunnelYear[];
  windows: { key: string; from: number; to: number }[];
  scale: { clamp: number; colours: readonly Rgb[] };
  captions: ReadonlyMap<number, string>;
  stars: boolean;
  reduceMotion: boolean;
  onLand(): void;
}): TunnelControl {
  const bus = useMemo(() => createFrameBus<TunnelFrame>(), []);
  const sceneRef = useRef<TunnelScene | null>(null);
  const pos = useRef(0);
  const shown = useRef(0);
  const player = useRef<PlayerHandle | null>(null);
  const [playing, setPlaying] = useState(false);
  const [speedIndex, setSpeedIndex] = useState(DEFAULT_SPEED);
  const [ended, setEnded] = useState(false);
  const live = useRef({ ...o, playing, speedIndex });
  useEffect(() => {
    live.current = { ...o, playing, speedIndex };
  });

  const stopSound = () => {
    player.current?.stop();
    player.current = null;
  };

  /** Sound from the current year on, at the current speed (the visual clock and the sound start together). */
  const startSound = useCallback(() => {
    stopSound();
    const l = live.current;
    const from = Math.round(pos.current);
    const captions = new Map([...l.captions].filter(([i]) => i >= from).map(([i, text]) => [i - from, text]));
    player.current = audio.playYearsAndMonths(l.rows.slice(from), { yearSec: 1 / YEARS_PER_SEC[l.speedIndex], player: "tunnel", captions });
  }, []);

  useEffect(() => () => stopSound(), []);
  useEffect(() => {
    if (live.current.playing) startSound();
  }, [speedIndex, startSound]);

  // The end: the last ring passed, the tunnel lands back on the turntable.
  useEffect(() => {
    if (!ended) return;
    const id = setTimeout(() => live.current.onLand(), LAND_AFTER_MS);
    return () => clearTimeout(id);
  }, [ended]);

  const build = useCallback(
    (host: SceneBuildHost): SceneHandle => {
      const l = live.current;
      const scene = createTunnelScene({ rows: l.rows, windows: l.windows, scale: l.scale, palette: host.palette });
      host.scene.add(scene.group);
      sceneRef.current = scene;
      const size = { width: 1, height: 1 };
      scene.setPosition(0, host.camera);
      return {
        update(dt) {
          const now = live.current;
          const last = now.rows.length - 1;
          if (now.playing) {
            pos.current = Math.min(last, pos.current + dt * YEARS_PER_SEC[now.speedIndex]);
            if (pos.current >= last) {
              setPlaying(false);
              setEnded(true);
            }
          }
          // Reduced motion: cuts from ring to ring, no glide.
          const goal = now.reduceMotion ? Math.round(pos.current) : pos.current;
          shown.current = now.reduceMotion ? goal : shown.current + (goal - shown.current) * (1 - Math.exp(-EASE_PER_SEC * dt));
          scene.setPosition(shown.current, host.camera);
          scene.setStars(now.stars);
          bus.publish(scene.frame(pos.current, host.camera, size.width, size.height));
        },
        resize(width, height) {
          size.width = width;
          size.height = height;
        },
        dispose() {
          host.scene.remove(scene.group);
          sceneRef.current = null;
          scene.dispose();
        },
      };
    },
    [bus],
  );

  const position = useCallback(() => pos.current, []);
  const toggle = useCallback(() => {
    const l = live.current;
    if (l.playing) {
      stopSound();
      setPlaying(false);
      return;
    }
    if (pos.current >= l.rows.length - 1) pos.current = 0;
    setEnded(false);
    setPlaying(true);
    live.current = { ...l, playing: true };
    startSound();
  }, [startSound]);
  const goTo = useCallback((index: number) => {
    stopSound();
    setPlaying(false);
    setEnded(false);
    pos.current = Math.min(live.current.rows.length - 1, Math.max(0, index));
  }, []);

  return { bus, build, position, playing, speedIndex, setSpeedIndex, toggle, goTo, ended };
}
