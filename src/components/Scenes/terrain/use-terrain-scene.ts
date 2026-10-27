"use client";

import { useCallback, useEffect, useMemo, useRef, type KeyboardEvent } from "react";
import { Vector3, type Texture } from "three";
import type { LatLon, Sequence, SequenceFrame, SstField } from "@/lib/data";
import { createFrameBus } from "../frame-bus";
import { createOrbit, type Orbit } from "../orbit";
import { planeFrame, type SceneFrame } from "../plane-frame";
import type { RainCell } from "../rain-particles";
import type { Relief } from "../relief";
import type { SceneBuildHost, SceneHandle } from "../types";
import { sstCell, type TerrainField } from "./field";
import { createTerrainScene, type TerrainLayers, type TerrainScene } from "./terrain-scene";
import { createTerrainSound } from "./terrain-sound";

/** Where the walk starts: the middle of the Bay of Bengal. */
export const WALK_START: LatLon = { lat: 15, lon: 88 };
const START_POSE = { yaw: 0, pitch: 0.92, distance: 27 };
const LIMITS = { minDistance: 1, maxDistance: 34, minPitch: 0.08, maxPitch: 1.4 };
/** Walking speed at 1×, in degrees per second (Shift: three times). Design, not data. */
const WALK_DEG_PER_SEC = 0.8;
const SHIFT_FACTOR = 3;
const TURN_RAD_PER_SEC = 1.6;
const FOLLOW_PER_SEC = 6;

const FORWARD = new Set(["w", "arrowup"]);
const BACK = new Set(["s", "arrowdown"]);
const LEFT = new Set(["a"]);
const RIGHT = new Set(["d"]);
const TURN_LEFT = new Set(["arrowleft"]);
const TURN_RIGHT = new Set(["arrowright"]);
const WALK_KEYS = new Set([...FORWARD, ...BACK, ...LEFT, ...RIGHT, ...TURN_LEFT, ...TURN_RIGHT]);

export interface TerrainControl {
  bus: ReturnType<typeof createFrameBus<SceneFrame>>;
  build(host: SceneBuildHost): SceneHandle;
  /** Walking keys are held, not stepped: true if the key was one. */
  keyDown(e: KeyboardEvent<HTMLElement>): boolean;
  walker(): LatLon;
  /** The SST under the walker (null = land), as the voice plays it. */
  value(): number | null;
  orbit(): Orbit | null;
  /** Test hook: put the walker somewhere (the hunt check). */
  placeWalker(at: LatLon): void;
}

export function useTerrainScene(o: {
  field: TerrainField;
  relief: Relief;
  sstImage: Texture;
  sst: SstField;
  seq: Sequence | null;
  frame: SequenceFrame | null;
  rain: { cells: RainCell[]; cellSize: number };
  decal: ImageBitmap | null;
  layers: TerrainLayers;
  speed: number;
  reduceMotion: boolean;
  hunting: boolean;
  onFound(): void;
}): TerrainControl {
  const bus = useMemo(() => createFrameBus<SceneFrame>(), []);
  const sceneRef = useRef<TerrainScene | null>(null);
  const orbitRef = useRef<Orbit | null>(null);
  const walkerRef = useRef<LatLon>(WALK_START);
  const valueRef = useRef<number | null>(null);
  const held = useRef(new Set<string>());
  const shift = useRef(false);
  const soundRef = useRef<ReturnType<typeof createTerrainSound> | null>(null);
  const live = useRef(o);
  useEffect(() => {
    live.current = o;
  });

  // Held keys end on key up anywhere (focus may have moved).
  useEffect(() => {
    const up = (e: globalThis.KeyboardEvent) => {
      held.current.delete(e.key.toLowerCase());
      shift.current = e.shiftKey;
    };
    const blur = () => held.current.clear();
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, []);

  const build = useCallback(
    (host: SceneBuildHost): SceneHandle => {
      const l = live.current;
      const scene = createTerrainScene({ field: l.field, relief: l.relief, sstImage: l.sstImage, palette: host.palette });
      host.scene.add(scene.group);
      sceneRef.current = scene;
      const plane = l.relief.plane;
      const sound = createTerrainSound(l.sst, plane, l.field.axis);
      soundRef.current = sound;
      sound.setFrame(l.seq, l.frame);
      const surface = (at: LatLon) => {
        const { x, z } = plane.toXZ(at.lat, at.lon);
        return new Vector3(x, scene.surfaceAt(at.lat, at.lon), z);
      };
      const orbit = createOrbit(host.camera, START_POSE, LIMITS, surface(walkerRef.current));
      orbitRef.current = orbit;
      scene.setRain(l.rain.cells, l.rain.cellSize);
      scene.setDecal(l.decal);
      const size = { width: 1, height: 1 };
      let found = false;
      return {
        update(dt) {
          const now = live.current;
          const keys = held.current;
          const has = (set: Set<string>) => [...set].some((k) => keys.has(k));
          const turn = (has(TURN_RIGHT) ? 1 : 0) - (has(TURN_LEFT) ? 1 : 0);
          if (turn) orbit.turn(-turn * TURN_RAD_PER_SEC * dt, 0);
          const fwd = (has(FORWARD) ? 1 : 0) - (has(BACK) ? 1 : 0);
          const side = (has(RIGHT) ? 1 : 0) - (has(LEFT) ? 1 : 0);
          if (fwd || side) {
            // Walk in the camera's heading: forward is away from the camera.
            const yaw = orbit.pose().yaw;
            const step = WALK_DEG_PER_SEC * now.speed * (shift.current ? SHIFT_FACTOR : 1) * dt;
            const dx = (-Math.sin(yaw) * fwd + Math.cos(yaw) * side) * step;
            const dz = (-Math.cos(yaw) * fwd - Math.sin(yaw) * side) * step;
            const p = plane.toXZ(walkerRef.current.lat, walkerRef.current.lon);
            const next = plane.toLatLon(p.x + dx, p.z + dz);
            const [w, s, e, n] = now.field.bounds;
            walkerRef.current = { lat: Math.min(n, Math.max(s, next.lat)), lon: Math.min(e, Math.max(w, next.lon)) };
          }
          const at = walkerRef.current;
          scene.setWalker(at);
          orbit.target.lerp(surface(at), now.reduceMotion ? 1 : 1 - Math.exp(-FOLLOW_PER_SEC * dt));
          orbit.update(dt, now.reduceMotion);
          valueRef.current = sound.at(at.lat, at.lon, orbit.pose().yaw, dt);
          // The hunt: arriving in the warmest cell (the grid's own maximum in the region).
          if (now.hunting && !found && sstCell(now.sst, at.lat, at.lon) === now.field.warmest.cell) {
            found = true;
            scene.sparkle(at, !now.reduceMotion);
            now.onFound();
          }
          if (!now.hunting) found = false;
          scene.setLayers(now.layers);
          scene.update(dt, !now.reduceMotion);
          bus.publish(planeFrame({ camera: host.camera, ...size, plane, groundAt: scene.surfaceAt, needle: at, distance: orbit.pose().distance }));
        },
        resize(width, height) {
          size.width = width;
          size.height = height;
        },
        dispose() {
          host.scene.remove(scene.group);
          sound.dispose();
          soundRef.current = null;
          sceneRef.current = null;
          orbitRef.current = null;
          scene.dispose();
        },
      };
    },
    [bus],
  );

  useEffect(() => {
    sceneRef.current?.setRain(o.rain.cells, o.rain.cellSize);
  }, [o.rain]);
  useEffect(() => {
    sceneRef.current?.setDecal(o.decal);
  }, [o.decal]);
  useEffect(() => {
    soundRef.current?.setFrame(o.seq, o.frame);
  }, [o.seq, o.frame]);

  const keyDown = useCallback((e: KeyboardEvent<HTMLElement>) => {
    const key = e.key.toLowerCase();
    shift.current = e.shiftKey;
    if (!WALK_KEYS.has(key)) return false;
    held.current.add(key);
    return true;
  }, []);
  const walker = useCallback(() => walkerRef.current, []);
  const value = useCallback(() => valueRef.current, []);
  const orbit = useCallback(() => orbitRef.current, []);
  const placeWalker = useCallback((at: LatLon) => {
    walkerRef.current = at;
  }, []);

  return { bus, build, keyDown, walker, value, orbit, placeWalker };
}
