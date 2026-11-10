"use client";

import { type Dispatch, type RefObject, useCallback, useEffect, useRef, useState } from "react";
import { Vector2 } from "three";
import { audio } from "@/lib/audio-jukebox";
import type { TrackMode } from "@/lib/audio-jukebox/types";
import { wrapLon, type LatLon, type LiveFields } from "@/lib/data";
import type { ZoomLevel } from "@/lib/geo/search";
import type { AppAction } from "../AppState/reducer";
import { useCanvasSize } from "../FrameView/use-canvas-size";
import { createControl } from "./control";
import { createFlight, type Flight } from "./flight";
import { cubicBezier } from "motion";
import { EASE_MECHANICAL } from "@/lib/motion";
import { createNeedleDrop, LIFT_HEIGHT, type DropKind } from "./needle-drop";
import type { SentReading } from "./needle-sound";
import type { RecordLabel } from "./record-label";
import type { LayerToggles } from "./settings";
import { DISTANCE, type CameraMode, type ScreenPoint, type TurntableScene } from "./scene";
import { useGlobeTexture, type GlobeTexture } from "./use-globe-texture";
import { useSceneAssets, type SceneSettings } from "./use-scene-assets";

export const NEEDLE_MAX_LAT = 80;
/** Rotation speeds (× one turn a minute); design choices, not data. */
export const SPEEDS = [0.25, 0.5, 1, 2, 4] as const;
/** A looked-around view turns back to the needle in this long when the needle moves (the motion tokens' scene length). */
const VIEW_RETURN_MS = 600;
/** The preview follows the pointer in steps this small (degrees): finer than the data's grid, coarser than every mouse move. */
const PREVIEW_STEP_DEG = 0.05;
const mechanicalEase = cubicBezier(...EASE_MECHANICAL);
const DEFAULT_SPEED_INDEX = 2;
const DEG_PER_SEC = 6;
const MAX_FRAME_SEC = 0.1; // after a stall, don't jump the globe
// While turning, the readout and panels follow the needle at 4 Hz (each sync re-renders the app);
// keys, clicks and stops sync at once. Sound follows at 30 Hz regardless.
const CURSOR_SYNC_MS = 250;
/** Arrow keys: a critically damped glide that settles in about 200 ms. */
const GLIDE_RATE = 24;
const GLIDE_SETTLED_DEG = 0.005;
/** Camera distance for each kind of place (globe radii); design choices. */
export const ZOOM_DISTANCE: Record<ZoomLevel, number> = { country: 3.0, region: 2.3, local: 1.35 };

const clampNeedleLat = (lat: number) => Math.min(NEEDLE_MAX_LAT, Math.max(-NEEDLE_MAX_LAT, lat));

interface Options {
  hostRef: RefObject<HTMLDivElement | null>;
  /** The current record's centre label (name and frame time). */
  label: RecordLabel;
  track: TrackMode;
  fields: LiveFields | null;
  liveOn: boolean;
  allMuted: boolean;
  reduceMotion: boolean;
  layers: LayerToggles;
  /** The intro will run (once per session): the arm waits at rest until startIntro(). */
  introPending: boolean;
  /** A scene is open over the turntable: no frames, no live sound (the needle drops again on return). */
  paused: boolean;
  start: LatLon;
  dispatch: Dispatch<AppAction>;
  onSend?: (sent: SentReading) => void;
  scene: SceneSettings;
}

/** What the HTML overlays need each frame. */
export interface FrameInfo {
  width: number;
  height: number;
  needle: ScreenPoint;
  /** 0 = Jukebox camera, 1 = Explore (eased). */
  blend: number;
  distance: number;
  /** The globe point facing the camera. */
  viewLat: number;
  viewLon: number;
  project(lat: number, lon: number): ScreenPoint;
  /** The frame's pixel under the needle (null: land, dry or no data). */
  swatch?: [number, number, number] | null;
  /** The needle as the turntable beside the globe shows it (DeckView). */
  pose?: DeckPose;
}

/** The needle on the record: its place, the arm's lift and park (0..1), the record's lift in a change, and the sound. */
export interface DeckPose extends LatLon {
  lift: number;
  park: number;
  recordLift: number;
  spinning: boolean;
  /** Reduced motion: no easing. */
  instant: boolean;
}

export interface Turntable {
  rotating: boolean;
  speed: number;
  cameraMode: CameraMode;
  setRotating(on: boolean): void;
  changeSpeed(step: 1 | -1): number;
  needle(): LatLon;
  nudge(dLat: number, dLon: number): void;
  moveTo(at: LatLon): void;
  /** A click on the globe: the arm lifts, swings to the point and drops. */
  pick(at: LatLon): void;
  /** Back to the framing that fits the globe into the free space. */
  resetFraming(): void;
  turnTo(at: LatLon): void;
  pickAt(clientX: number, clientY: number): LatLon | null;
  /** Looks around: turns the globe by `deg` without moving the needle or what's playing. Any needle move turns it back. */
  look(deg: number): void;
  /** The point being previewed (the globe under the mouse, or the record under a drag), or null. Silent. */
  preview: LatLon | null;
  setPreview(at: LatLon | null): void;
  /** Lifts the needle off the record and silences it (a drag on the record), or lets it down again. */
  hold(on: boolean): void;
  /** Eased flight that brings `at` under the needle; resolves on arrival (or at once if cancelled). */
  flyTo(at: LatLon, zoom: ZoomLevel): Promise<boolean>;
  /** Stops a flight; true if one was running. */
  cancelFlight(): boolean;
  setCameraMode(mode: CameraMode): void;
  zoomBy(factor: number): void;
  distance(): number;
  /** Ends a running record change at once; true if one was running. */
  skipAnimation(): boolean;
  /** Plays the record-change animation (no track change); resolves once the needle has settled. */
  changeRecord(): Promise<void>;
  /** The intro: the camera glides in from a wide shot while the arm swings onto the globe. */
  startIntro(): void;
  /** Ends the intro at once (camera in place, needle down); true if it was running. */
  skipIntro(): boolean;
  /** ms timestamp of the last user action on the turntable (for the idle hint). */
  lastInput(): number;
  subscribe(fn: (f: FrameInfo) => void): () => void;
  texture: GlobeTexture;
  /** R3F hands the scene over here once it exists (and null when it's gone). */
  onSceneReady(scene: TurntableScene | null): void;
  scene: TurntableScene | null;
  sceneRef: RefObject<TurntableScene | null>;
  fpsRef: RefObject<number>;
  particlesSpawned: RefObject<number>;
}

export function useTurntable(o: Options): Turntable {
  const { hostRef, dispatch, paused } = o;
  const sceneRef = useRef<TurntableScene | null>(null);
  const [scene, setScene] = useState<TurntableScene | null>(null);
  const fpsRef = useRef(0);
  const particlesSpawned = useRef(0);
  const unsynced = useRef(false);
  const lastSync = useRef(0);
  const startPose = { lat: clampNeedleLat(o.start.lat), lon: o.start.lon };
  const pose = useRef<LatLon>(startPose);
  const reading = useRef<LatLon>(startPose);
  const motion = useRef({ lift: 0, park: 0 });
  const recordLift = useRef(0);
  /** Where a pick is swinging from and to. */
  const swing = useRef<{ from: LatLon; to: LatLon } | null>(null);
  /** Where the arrow keys are gliding to, and how fast the glide is going. */
  const glide = useRef<{ lat: number; lon: number; vLat: number; vLon: number } | null>(null);
  /** The view turned away from the needle by a drag (degrees), and its ease back when the needle moves. */
  const yaw = useRef({ deg: 0, from: 0, startedAt: -1 });
  const [preview, setPreviewState] = useState<LatLon | null>(null);
  const setPreview = useCallback((at: LatLon | null) => {
    setPreviewState((was) => {
      if (!at || !was) return at;
      return Math.abs(at.lat - was.lat) < PREVIEW_STEP_DEG && Math.abs(wrapLon(at.lon - was.lon)) < PREVIEW_STEP_DEG ? was : at;
    });
  }, []);
  const drop = useRef(createNeedleDrop());
  const dropDone = useRef<(() => void) | null>(null);
  const holding = useRef(false);
  const flight = useRef<{ flight: Flight; resolve: (arrived: boolean) => void } | null>(null);
  const subscribers = useRef(new Set<(f: FrameInfo) => void>());
  const inputAt = useRef(0);
  const size = useRef({ width: 1, height: 1 });

  const [rotating, setRotatingState] = useState(!o.reduceMotion);
  const [speedIndex, setSpeedIndex] = useState(DEFAULT_SPEED_INDEX);
  const [cameraMode, setCameraModeState] = useState<CameraMode>("jukebox");
  const speedIndexNow = useRef(DEFAULT_SPEED_INDEX);
  const live = useRef({ ...o, rotating, speed: SPEEDS[speedIndex] });
  useEffect(() => {
    live.current = { ...o, rotating, speed: SPEEDS[speedIndex] };
  });

  const hostSize = useCanvasSize(hostRef);
  const texture = useGlobeTexture(o.track, o.fields?.sst ?? null, () => sceneRef.current?.earth.dataChanged());
  const textureRef = useRef(texture);
  useEffect(() => {
    textureRef.current = texture;
  });

  const onSceneReady = useCallback((s: TurntableScene | null) => {
    sceneRef.current = s;
    setScene(s);
  }, []);


  const touched = () => {
    inputAt.current = performance.now();
  };

  const applyPose = useCallback(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    scene.setPose(pose.current.lat, pose.current.lon, yaw.current.deg);
    // Stored as read: the reducer leaves these numbers unchanged, so the
    // readout, speech and sound all look up the same grid cell.
    reading.current = scene.readNeedle();
    unsynced.current = true;
  }, []);

  const syncCursor = useCallback(() => {
    dispatch({ type: "setCursor", cursor: reading.current });
    unsynced.current = false;
    lastSync.current = performance.now();
  }, [dispatch]);

  const setRotating = useCallback(
    (wanted: boolean) => {
      // Reduced motion: no self-running turn at all.
      const on = wanted && !live.current.reduceMotion;
      setRotatingState(on);
      live.current.rotating = on;
      if (!on) syncCursor();
    },
    [syncCursor],
  );

  const cancelFlight = useCallback(() => {
    const f = flight.current;
    if (!f) return false;
    flight.current = null;
    f.resolve(false);
    syncCursor();
    return true;
  }, [syncCursor]);

  const setCameraMode = useCallback((mode: CameraMode) => {
    sceneRef.current?.rig.setMode(mode);
    setCameraModeState(mode);
  }, []);

  /** Any needle move brings the looked-around view back to the needle: eased with the move, at once under reduced motion. */
  const returnView = useCallback(() => {
    const y = yaw.current;
    if (y.deg === 0) return;
    if (live.current.reduceMotion) {
      y.deg = 0;
      y.startedAt = -1;
      return;
    }
    y.from = y.deg;
    y.startedAt = performance.now();
  }, []);

  const place = useCallback(
    (at: LatLon, syncNow: boolean) => {
      touched();
      returnView();
      cancelFlight();
      glide.current = null;
      swing.current = null;
      if (live.current.rotating) setRotating(false);
      pose.current = { lat: clampNeedleLat(at.lat), lon: wrapLon(at.lon) };
      applyPose();
      if (syncNow) syncCursor();
    },
    [applyPose, cancelFlight, returnView, setRotating, syncCursor],
  );

  const needle = useCallback(() => reading.current, []);
  const lastInput = useCallback(() => inputAt.current, []);

  const subscribe = useCallback((fn: (f: FrameInfo) => void) => {
    subscribers.current.add(fn);
    return () => {
      subscribers.current.delete(fn);
    };
  }, []);

  const startDrop = useCallback((kind: DropKind) => {
    drop.current.start(performance.now(), { reduceMotion: live.current.reduceMotion, kind });
    holding.current = true;
    audio.silenceLive();
  }, []);

  // The loop runs as long as R3F's scene exists (TurntableCanvas creates and disposes it).
  useEffect(() => {
    const host = hostRef.current;
    if (!host || !scene) return;
    if (paused) {
      audio.silenceLive();
      return;
    }
    const { width, height } = host.getBoundingClientRect();
    size.current = { width, height };
    applyPose();
    syncCursor();
    const control = createControl((sent) => live.current.onSend?.(sent));
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
      const f = flight.current;
      if (f) {
        const s = f.flight.sample(now);
        pose.current = { lat: s.lat, lon: s.lon };
        scene.rig.setDistance(s.distance, true);
        moved = true;
        if (s.done) {
          flight.current = null;
          f.resolve(true);
        }
      } else if (o.rotating) {
        // West to east, like the Earth: the longitude under the needle falls.
        pose.current = { lat: pose.current.lat, lon: wrapLon(pose.current.lon - DEG_PER_SEC * o.speed * dt) };
        moved = true;
      }
      const g = glide.current;
      if (g && !flight.current) {
        // A critically damped step, exact for any dt: it can't overshoot.
        const offLat = pose.current.lat - g.lat;
        const offLon = wrapLon(pose.current.lon - g.lon);
        const decay = Math.exp(-GLIDE_RATE * dt);
        const slipLat = (g.vLat + GLIDE_RATE * offLat) * dt;
        const slipLon = (g.vLon + GLIDE_RATE * offLon) * dt;
        const nextLat = (offLat + slipLat) * decay;
        const nextLon = (offLon + slipLon) * decay;
        g.vLat = (g.vLat - GLIDE_RATE * slipLat) * decay;
        g.vLon = (g.vLon - GLIDE_RATE * slipLon) * decay;
        const settled = Math.abs(nextLat) < GLIDE_SETTLED_DEG && Math.abs(nextLon) < GLIDE_SETTLED_DEG;
        pose.current = settled ? { lat: g.lat, lon: wrapLon(g.lon) } : { lat: g.lat + nextLat, lon: wrapLon(g.lon + nextLon) };
        moved = true;
        if (settled) {
          glide.current = null;
          unsynced.current = true;
          lastSync.current = 0;
        }
      }
      const d = drop.current.step(now);
      if (d) {
        motion.current = { lift: d.lift, park: d.park };
        const path = swing.current;
        if (path) pose.current = { lat: path.from.lat + (path.to.lat - path.from.lat) * d.swing, lon: wrapLon(path.from.lon + wrapLon(path.to.lon - path.from.lon) * d.swing) };
        recordLift.current = d.recordLift;
        moved = true;
        if (d.landed && o.liveOn && !o.allMuted) audio.playNeedleDrop();
        if (d.done) {
          if (path) {
            swing.current = null;
            lastSync.current = 0;
            unsynced.current = true;
          }
          holding.current = false;
          dropDone.current?.();
          dropDone.current = null;
        }
      }
      const y = yaw.current;
      if (y.startedAt >= 0) {
        const t = Math.min(1, (now - y.startedAt) / VIEW_RETURN_MS);
        y.deg = y.from * (1 - mechanicalEase(t));
        if (t >= 1) {
          y.deg = 0;
          y.startedAt = -1;
        }
        moved = true;
      }
      if (moved) applyPose();
      scene.effects.setMotion(!o.reduceMotion);
      particlesSpawned.current += scene.update(dt, { instant: o.reduceMotion, layers: o.layers });
      scene.render();

      const view = scene.viewCenter();
      const viewLon = view.lon;
      if (subscribers.current.size > 0) {
        const info: FrameInfo = {
          width: size.current.width,
          height: size.current.height,
          needle: scene.projectNeedle(),
          blend: scene.rig.blend(),
          distance: scene.rig.distance(),
          viewLat: view.lat,
          viewLon,
          project: scene.project,
          swatch: scene.effects.swatchColor(),
          pose: { ...pose.current, ...motion.current, recordLift: recordLift.current, spinning: o.liveOn && !o.allMuted && !holding.current, instant: o.reduceMotion },
        };
        for (const fn of subscribers.current) fn(info);
      }

      frames++;
      if (now - fpsSince >= 1000) {
        fpsRef.current = (frames * 1000) / (now - fpsSince);
        frames = 0;
        fpsSince = now;
      }

      if (o.fields) {
        control.tick(
          now,
          {
            fields: o.fields,
            track: o.track,
            needle: reading.current,
            viewLon,
            soundOn: o.liveOn && !holding.current,
            allMuted: o.allMuted,
            sample: textureRef.current.sample,
          },
          scene.effects,
        );
      }
      if (unsynced.current && !flight.current && now - lastSync.current >= CURSOR_SYNC_MS) syncCursor();
    };
    raf = requestAnimationFrame(loop);
    if (live.current.introPending) {
      // The arm waits at rest, silent, until the intro starts.
      motion.current = { lift: 0, park: 1 };
      holding.current = true;
      audio.silenceLive();
      applyPose();
    } else {
      startDrop("drop"); // putting a record on is a needle drop too
    }

    return () => {
      cancelAnimationFrame(raf);
      dropDone.current?.();
      dropDone.current = null;
      flight.current?.resolve(false);
      flight.current = null;
      if (unsynced.current) syncCursor(); // the flat map opens where the needle was
    };
  }, [hostRef, scene, paused, applyPose, syncCursor, startDrop]);

  useSceneAssets(scene, o.scene);

  // R3F sizes the canvas and the post chain; the overlays project with the same size.
  useEffect(() => {
    if (hostSize) size.current = { width: hostSize.width, height: hostSize.height };
  }, [hostSize]);

  // Every record change is a record-change animation, wherever it was chosen.
  const trackWas = useRef(o.track);
  useEffect(() => {
    if (trackWas.current === o.track) return;
    trackWas.current = o.track;
    startDrop("change");
  }, [o.track, startDrop]);

  // Reduced motion switched on: stop turning (it can be started again by hand).
  const [reduceMotionWas, setReduceMotionWas] = useState(o.reduceMotion);
  if (o.reduceMotion !== reduceMotionWas) {
    setReduceMotionWas(o.reduceMotion);
    if (o.reduceMotion) setRotatingState(false);
  }

  const startIntro = useCallback(() => {
    sceneRef.current?.rig.startIntro();
    startDrop("intro");
  }, [startDrop]);

  const skipIntro = useCallback(() => {
    const running = drop.current.running();
    sceneRef.current?.rig.skipIntro();
    if (running) drop.current.skip(performance.now());
    return running;
  }, []);

  const toExplore = () => {
    if (sceneRef.current?.rig.mode !== "explore") setCameraMode("explore");
  };

  return {
    rotating,
    speed: SPEEDS[speedIndex],
    cameraMode,
    setRotating(on) {
      touched();
      setRotating(on);
    },
    changeSpeed(step) {
      touched();
      const i = Math.min(SPEEDS.length - 1, Math.max(0, speedIndexNow.current + step));
      speedIndexNow.current = i;
      live.current.speed = SPEEDS[i];
      setSpeedIndex(i);
      return SPEEDS[i];
    },
    needle,
    nudge(dLat, dLon) {
      toExplore();
      returnView();
      if (live.current.reduceMotion) {
        place({ lat: pose.current.lat + dLat, lon: pose.current.lon + dLon }, true);
        return;
      }
      touched();
      cancelFlight();
      swing.current = null;
      if (live.current.rotating) setRotating(false);
      const from = glide.current ?? { ...pose.current, vLat: 0, vLon: 0 };
      glide.current = { lat: clampNeedleLat(from.lat + dLat), lon: from.lon + dLon, vLat: from.vLat, vLon: from.vLon };
    },
    moveTo: (at) => place(at, true),
    pick(at) {
      if (live.current.reduceMotion) {
        // No drop to lower the needle: put it down at once (a drag on the record had lifted and silenced it).
        holding.current = false;
        motion.current = { lift: 0, park: 0 };
        place(at, true);
        return;
      }
      touched();
      returnView();
      cancelFlight();
      glide.current = null;
      if (live.current.rotating) setRotating(false);
      swing.current = { from: { ...pose.current }, to: { lat: clampNeedleLat(at.lat), lon: wrapLon(at.lon) } };
      startDrop("pick");
    },
    resetFraming() {
      sceneRef.current?.rig.resetFraming();
    },
    turnTo: (at) => place(at, false),
    look(deg) {
      touched();
      const y = yaw.current;
      y.startedAt = -1;
      y.deg = ((y.deg + deg + 540) % 360) - 180;
      applyPose();
    },
    preview,
    setPreview,
    hold(on) {
      touched();
      holding.current = on;
      motion.current = { lift: on ? LIFT_HEIGHT : 0, park: 0 };
      if (on) audio.silenceLive();
      applyPose();
    },
    pickAt(clientX, clientY) {
      const host = hostRef.current;
      const scene = sceneRef.current;
      if (!host || !scene) return null;
      const r = host.getBoundingClientRect();
      return scene.pick(new Vector2(((clientX - r.left) / r.width) * 2 - 1, 1 - ((clientY - r.top) / r.height) * 2));
    },
    flyTo(at, zoom) {
      touched();
      returnView();
      const scene = sceneRef.current;
      cancelFlight();
      if (live.current.rotating) setRotating(false);
      toExplore();
      const target = { lat: clampNeedleLat(at.lat), lon: wrapLon(at.lon), distance: ZOOM_DISTANCE[zoom] };
      if (!scene || live.current.reduceMotion) {
        scene?.rig.setDistance(target.distance, true);
        pose.current = { lat: target.lat, lon: target.lon };
        applyPose();
        syncCursor();
        return Promise.resolve(true);
      }
      const from = { ...pose.current, distance: scene.rig.distance() };
      return new Promise<boolean>((resolve) => {
        flight.current = {
          flight: createFlight(from, target, performance.now()),
          resolve: (arrived) => {
            if (arrived) syncCursor();
            resolve(arrived);
          },
        };
      });
    },
    cancelFlight,
    setCameraMode(mode) {
      touched();
      setCameraMode(mode);
    },
    zoomBy(factor) {
      touched();
      const scene = sceneRef.current;
      if (!scene) return;
      toExplore();
      scene.rig.setDistance(1 + (scene.rig.targetDistance() - 1) * factor);
    },
    distance: () => sceneRef.current?.rig.distance() ?? DISTANCE.explore,
    startIntro,
    skipIntro,
    skipAnimation() {
      if (!drop.current.running()) return false;
      drop.current.skip(performance.now());
      return true;
    },
    changeRecord() {
      touched();
      dropDone.current?.();
      return new Promise<void>((resolve) => {
        dropDone.current = resolve;
        startDrop("change");
      });
    },
    lastInput,
    subscribe,
    texture,
    onSceneReady,
    scene,
    sceneRef,
    fpsRef,
    particlesSpawned,
  };
}
