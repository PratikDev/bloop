"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { wrapLon, type LatLon } from "@/lib/data";
import type { FrameInfo } from "../../Turntable/use-turntable";
import { createFrameBus } from "../frame-bus";
import { createOrbit, type Orbit } from "../orbit";
import type { SceneBuildHost, SceneHandle } from "../types";
import type { GhostField } from "./fields";
import { globeFrame } from "./globe-frame";
import { createGhostScene, type GhostLayers, type GhostScene, type ShellScale } from "./ghost-scene";

const RAD = Math.PI / 180;
/** Opening view: Dhaka (a places.json place, so the chip opens on published numbers). */
const START: LatLon = { lat: 23.81, lon: 90.41 };
const LIMITS = { minDistance: 1.3, maxDistance: 7, minPitch: -80 * RAD, maxPitch: 80 * RAD };
const START_DISTANCE = 6;
/** Auto-turn at speed 1: the Turntable's one turn a minute. */
const SPIN_DEG_PER_SEC = 6;

export interface GhostSceneControl {
  bus: ReturnType<typeof createFrameBus<FrameInfo>>;
  build(host: SceneBuildHost): SceneHandle;
  onReady(handle: SceneHandle | null): void;
  /** The point under the needle (the centre of the view). */
  needle(): LatLon;
  orbit(): Orbit | null;
  /** Turn so `at` is under the needle (eased; instant with reduced motion). */
  lookAt(at: LatLon, distance?: number): void;
}

export function useGhostScene(o: {
  field: GhostField | null;
  scale: ShellScale;
  layers: GhostLayers;
  spinning: boolean;
  speed: number;
  reduceMotion: boolean;
}): GhostSceneControl {
  const bus = useMemo(() => createFrameBus<FrameInfo>(), []);
  const sceneRef = useRef<GhostScene | null>(null);
  const orbitRef = useRef<Orbit | null>(null);
  const needleRef = useRef<LatLon>(START);
  const live = useRef(o);
  useEffect(() => {
    live.current = o;
  });

  const build = useCallback(
    (host: SceneBuildHost): SceneHandle => {
      const scene = createGhostScene(host);
      sceneRef.current = scene;
      const orbit = createOrbit(host.camera, { yaw: START.lon * RAD, pitch: START.lat * RAD, distance: START_DISTANCE }, LIMITS);
      orbitRef.current = orbit;
      const size = { width: 1, height: 1 };
      return {
        globe: scene.globe,
        update(dt) {
          const l = live.current;
          // West to east, like the Earth: the longitude in view falls.
          if (l.spinning && !l.reduceMotion) orbit.turn(-SPIN_DEG_PER_SEC * l.speed * RAD * dt, 0);
          orbit.update(dt, l.reduceMotion);
          const pose = orbit.pose();
          needleRef.current = { lat: pose.pitch / RAD, lon: wrapLon(pose.yaw / RAD) };
          bus.publish(globeFrame(host.camera, size.width, size.height, needleRef.current));
        },
        resize(width, height) {
          size.width = width;
          size.height = height;
        },
        dispose() {
          sceneRef.current = null;
          orbitRef.current = null;
          scene.dispose();
        },
      };
    },
    [bus],
  );

  const onReady = useCallback((handle: SceneHandle | null) => {
    if (!handle) return;
    const l = live.current;
    sceneRef.current?.setLayers(l.layers);
    if (l.field) sceneRef.current?.setField(l.field, l.scale);
  }, []);

  useEffect(() => {
    if (o.field) sceneRef.current?.setField(o.field, o.scale);
  }, [o.field, o.scale]);

  const { ghost, core, stars } = o.layers;
  useEffect(() => {
    sceneRef.current?.setLayers({ ghost, core, stars });
  }, [ghost, core, stars]);

  return {
    bus,
    build,
    onReady,
    needle: useCallback(() => needleRef.current, []),
    orbit: useCallback(() => orbitRef.current, []),
    lookAt: useCallback((at: LatLon, distance?: number) => {
      const orbit = orbitRef.current;
      if (!orbit) return;
      // The shortest way round: the yaw goal stays within half a turn of where it is.
      const yaw = orbit.pose().yaw;
      const target = at.lon * RAD;
      const turns = Math.round((yaw - target) / (2 * Math.PI));
      orbit.set({ yaw: target + turns * 2 * Math.PI, pitch: at.lat * RAD, ...(distance ? { distance } : {}) }, live.current.reduceMotion);
    }, []),
  };
}
