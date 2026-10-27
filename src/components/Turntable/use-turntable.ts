"use client";

import { useCallback, useEffect, useRef, useState, type Dispatch, type RefObject } from "react";
import { Vector2 } from "three";
import { audio } from "@/lib/audio-adapter";
import type { TrackMode } from "@/lib/audio-adapter/types";
import { readPalette } from "@/lib/css-tokens";
import { wrapLon, type LatLon, type LiveFields } from "@/lib/data";
import type { AppAction } from "../AppState/reducer";
import { useCanvasSize } from "../FrameView/use-canvas-size";
import { createNeedleDrop } from "./needle-drop";
import { createNeedleSound, type SentReading } from "./needle-sound";
import { createTurntableScene, type TurntableScene } from "./scene";
import { useGlobeTexture } from "./use-globe-texture";

export const NEEDLE_MAX_LAT = 80;
/** Rotation speeds (× one turn a minute); design choices, not data. */
export const SPEEDS = [0.25, 0.5, 1, 2, 4] as const;
const DEFAULT_SPEED_INDEX = 2;
const DEG_PER_SEC = 6;
const MAX_FRAME_SEC = 0.1; // after a stall, don't jump the globe
const CURSOR_SYNC_MS = 150; // the readout and panels follow the needle at ~7 Hz

const clampNeedleLat = (lat: number) => Math.min(NEEDLE_MAX_LAT, Math.max(-NEEDLE_MAX_LAT, lat));

interface Options {
  /** The element the WebGL canvas is created in (a fresh canvas per mount, so its context can be released). */
  hostRef: RefObject<HTMLDivElement | null>;
  canvasLabel: string;
  track: TrackMode;
  fields: LiveFields | null;
  /** Live sound may play (started, sound on, playing, intro over). */
  liveOn: boolean;
  allMuted: boolean;
  reduceMotion: boolean;
  start: LatLon;
  dispatch: Dispatch<AppAction>;
  onSend?: (sent: SentReading) => void;
}

export interface Turntable {
  rotating: boolean;
  speed: number;
  setRotating(on: boolean): void;
  /** One speed step up or down (clamped); returns the new speed. */
  changeSpeed(step: 1 | -1): number;
  /** What the needle reads now (the same numbers the readout and sound use). */
  needle(): LatLon;
  /** Moves the needle by whole steps (keys); stops the turning. */
  nudge(dLat: number, dLon: number): void;
  /** Brings `at` under the needle (click, tap, debug); stops the turning. */
  moveTo(at: LatLon): void;
  /** Turns the globe so `lon` is under the needle (drag); stops the turning. */
  turnTo(lon: number): void;
  /** The globe point under a viewport position, or null off the globe. */
  pickAt(clientX: number, clientY: number): LatLon | null;
  dropNeedle(): void;
  sceneRef: RefObject<TurntableScene | null>;
  fpsRef: RefObject<number>;
}

export function useTurntable(o: Options): Turntable {
  const { hostRef, dispatch } = o;
  const sceneRef = useRef<TurntableScene | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fpsRef = useRef(0);
  const dirty = useRef(true); // needs a render
  const unsynced = useRef(false); // the app cursor is behind the needle
  const lastSync = useRef(0);
  const startPose = { lat: clampNeedleLat(o.start.lat), lon: o.start.lon };
  const pose = useRef<LatLon>(startPose);
  const reading = useRef<LatLon>(startPose);
  const lift = useRef(0);
  const drop = useRef(createNeedleDrop());
  const holding = useRef(false); // the data voices wait during a needle drop

  const [rotating, setRotatingState] = useState(!o.reduceMotion);
  const [speedIndex, setSpeedIndex] = useState(DEFAULT_SPEED_INDEX);
  const speedIndexNow = useRef(DEFAULT_SPEED_INDEX); // so steps in one event add up
  const live = useRef({ ...o, rotating, speed: SPEEDS[speedIndex] });
  useEffect(() => {
    live.current = { ...o, rotating, speed: SPEEDS[speedIndex] };
  });

  const hostSize = useCanvasSize(hostRef);
  const textureCanvas = useGlobeTexture(o.track, o.fields?.sst ?? null, () => {
    sceneRef.current?.textureChanged();
    dirty.current = true;
  });

  const applyPose = useCallback(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    scene.setPose(pose.current.lat, pose.current.lon, lift.current);
    // Stored as read: the reducer leaves these numbers unchanged, so the
    // readout, speech and sound all look up the same grid cell.
    reading.current = scene.readNeedle();
    dirty.current = true;
    unsynced.current = true;
  }, []);

  const syncCursor = useCallback(() => {
    dispatch({ type: "setCursor", cursor: reading.current });
    unsynced.current = false;
    lastSync.current = performance.now();
  }, [dispatch]);

  const setRotating = useCallback(
    (on: boolean) => {
      setRotatingState(on);
      live.current.rotating = on;
      if (!on) syncCursor();
    },
    [syncCursor],
  );

  const place = useCallback(
    (at: LatLon, syncNow: boolean) => {
      if (live.current.rotating) setRotating(false);
      pose.current = { lat: clampNeedleLat(at.lat), lon: wrapLon(at.lon) };
      applyPose();
      if (syncNow) syncCursor();
    },
    [applyPose, setRotating, syncCursor],
  );

  const dropNeedle = useCallback(() => {
    drop.current.start(performance.now(), live.current.reduceMotion);
    holding.current = true;
    audio.silenceLive();
  }, []);

  // The scene and its loop live as long as the view.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const canvas = document.createElement("canvas");
    canvas.className = "absolute inset-0 size-full";
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", live.current.canvasLabel);
    host.append(canvas);
    canvasRef.current = canvas;
    const scene = createTurntableScene(canvas, textureCanvas, readPalette());
    sceneRef.current = scene;
    const { width, height } = host.getBoundingClientRect();
    if (width > 0 && height > 0) scene.resize(width, height);
    applyPose();
    syncCursor();
    const sound = createNeedleSound((sent) => live.current.onSend?.(sent));
    let frames = 0;
    let fpsSince = performance.now();
    let prev = fpsSince;
    let raf = 0;

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const o = live.current;
      const dt = Math.min(MAX_FRAME_SEC, (now - prev) / 1000);
      prev = now;
      let moved = false;
      if (o.rotating) {
        // West to east, like the Earth: the longitude under the needle falls.
        pose.current = { lat: pose.current.lat, lon: wrapLon(pose.current.lon - DEG_PER_SEC * o.speed * dt) };
        moved = true;
      }
      const d = drop.current.step(now);
      if (d) {
        lift.current = d.lift;
        moved = true;
        if (d.landed && o.liveOn && !o.allMuted) audio.playNeedleDrop();
        if (d.done) holding.current = false;
      }
      if (moved) applyPose();
      if (dirty.current) {
        scene.render();
        dirty.current = false;
      }

      frames++;
      if (now - fpsSince >= 1000) {
        fpsRef.current = (frames * 1000) / (now - fpsSince);
        frames = 0;
        fpsSince = now;
      }

      if (o.liveOn && o.fields && !holding.current) sound.tick(o.fields, reading.current, now);
      else sound.reset();
      if (unsynced.current && now - lastSync.current >= CURSOR_SYNC_MS) syncCursor();
    };
    raf = requestAnimationFrame(loop);
    dropNeedle(); // putting a record on is a needle drop too

    return () => {
      cancelAnimationFrame(raf);
      if (unsynced.current) syncCursor(); // the flat map opens where the needle was
      sceneRef.current = null;
      canvasRef.current = null;
      scene.dispose();
      canvas.remove();
    };
  }, [hostRef, textureCanvas, applyPose, syncCursor, dropNeedle]);

  useEffect(() => {
    if (!hostSize) return;
    sceneRef.current?.resize(hostSize.width, hostSize.height);
    dirty.current = true;
  }, [hostSize]);

  useEffect(() => {
    canvasRef.current?.setAttribute("aria-label", o.canvasLabel);
  }, [o.canvasLabel]);

  // Every record change is a needle drop, wherever it was chosen (carousel, keys, track buttons).
  const trackWas = useRef(o.track);
  useEffect(() => {
    if (trackWas.current === o.track) return;
    trackWas.current = o.track;
    dropNeedle();
  }, [o.track, dropNeedle]);

  // Reduced motion switched on: stop turning (it can be started again by hand).
  const [reduceMotionWas, setReduceMotionWas] = useState(o.reduceMotion);
  if (o.reduceMotion !== reduceMotionWas) {
    setReduceMotionWas(o.reduceMotion);
    if (o.reduceMotion) setRotatingState(false);
  }

  return {
    rotating,
    speed: SPEEDS[speedIndex],
    setRotating,
    changeSpeed(step) {
      const i = Math.min(SPEEDS.length - 1, Math.max(0, speedIndexNow.current + step));
      speedIndexNow.current = i;
      live.current.speed = SPEEDS[i];
      setSpeedIndex(i);
      return SPEEDS[i];
    },
    needle: () => reading.current,
    nudge: (dLat, dLon) => place({ lat: pose.current.lat + dLat, lon: pose.current.lon + dLon }, true),
    moveTo: (at) => place(at, true),
    turnTo: (lon) => place({ lat: pose.current.lat, lon }, false),
    pickAt(clientX, clientY) {
      const canvas = canvasRef.current;
      const scene = sceneRef.current;
      if (!canvas || !scene) return null;
      const r = canvas.getBoundingClientRect();
      return scene.pick(new Vector2(((clientX - r.left) / r.width) * 2 - 1, 1 - ((clientY - r.top) / r.height) * 2));
    },
    dropNeedle,
    sceneRef,
    fpsRef,
  };
}
