"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { Vector2, Vector3 } from "three";
import type { LatLon } from "@/lib/data";
import { createFrameBus } from "../frame-bus";
import { createOrbit, type Orbit } from "../orbit";
import { planeFrame, type SceneFrame } from "../plane-frame";
import type { RainCell } from "../rain-particles";
import type { SceneBuildHost, SceneHandle } from "../types";
import { createDeltaScene, type DeltaLayers, type DeltaScene, type DeltaSceneData } from "./delta-scene";

const START_POSE = { yaw: 0.38, pitch: 0.62, distance: 19 };
const LIMITS = { minDistance: 2.5, maxDistance: 26, minPitch: 0.12, maxPitch: 1.45 };
const FOLLOW_PER_SEC = 4;
/** Far out, the view looks a little east of the needle so the aquifer column beside the map stays in frame. */
const EAST_LOOK_PER_UNIT = 0.12;

export interface DeltaControl {
  bus: ReturnType<typeof createFrameBus<SceneFrame>>;
  build(host: SceneBuildHost): SceneHandle;
  orbit(): Orbit | null;
  /** The point under a canvas position (CSS px within the host), or null. */
  pick(x: number, y: number, width: number, height: number): LatLon | null;
}

export function useDeltaScene(o: {
  data: DeltaSceneData;
  needle: LatLon;
  levels: { Bangladesh: number | null; NW_India: number | null };
  rain: { cells: RainCell[]; cellSize: number };
  decal: ImageBitmap | null;
  layers: DeltaLayers;
  reduceMotion: boolean;
}): DeltaControl {
  const bus = useMemo(() => createFrameBus<SceneFrame>(), []);
  const sceneRef = useRef<DeltaScene | null>(null);
  const orbitRef = useRef<Orbit | null>(null);
  const cameraRef = useRef<SceneBuildHost["camera"] | null>(null);
  const live = useRef(o);
  useEffect(() => {
    live.current = o;
  });

  const build = useCallback(
    (host: SceneBuildHost): SceneHandle => {
      const l = live.current;
      const scene = createDeltaScene(l.data, host.palette);
      host.scene.add(scene.group);
      sceneRef.current = scene;
      cameraRef.current = host.camera;
      const ground = (at: LatLon) => {
        const { x, z } = scene.plane.toXZ(at.lat, at.lon);
        return new Vector3(x, scene.groundAt(at.lat, at.lon), z);
      };
      const orbit = createOrbit(host.camera, START_POSE, LIMITS, ground(l.needle));
      orbitRef.current = orbit;
      scene.setLevels(l.levels);
      scene.setRain(l.rain.cells, l.rain.cellSize);
      scene.setDecal(l.decal);
      scene.setNeedle(l.needle);
      const size = { width: 1, height: 1 };
      return {
        update(dt) {
          const now = live.current;
          // The camera follows the needle.
          const goal = ground(now.needle);
          goal.x += orbit.pose().distance * EAST_LOOK_PER_UNIT;
          orbit.target.lerp(goal, now.reduceMotion ? 1 : 1 - Math.exp(-FOLLOW_PER_SEC * dt));
          orbit.update(dt, now.reduceMotion);
          scene.setLayers(now.layers, orbit.pose().distance);
          scene.update(dt, !now.reduceMotion);
          bus.publish(planeFrame({ camera: host.camera, ...size, plane: scene.plane, groundAt: scene.groundAt, needle: now.needle, distance: orbit.pose().distance, anchors: scene.anchors }));
        },
        resize(width, height) {
          size.width = width;
          size.height = height;
        },
        dispose() {
          host.scene.remove(scene.group);
          sceneRef.current = null;
          orbitRef.current = null;
          scene.dispose();
        },
      };
    },
    [bus],
  );

  useEffect(() => {
    sceneRef.current?.setLevels(o.levels);
  }, [o.levels]);
  useEffect(() => {
    sceneRef.current?.setRain(o.rain.cells, o.rain.cellSize);
  }, [o.rain]);
  useEffect(() => {
    sceneRef.current?.setDecal(o.decal);
  }, [o.decal]);
  useEffect(() => {
    sceneRef.current?.setNeedle(o.needle);
  }, [o.needle]);

  return {
    bus,
    build,
    orbit: useCallback(() => orbitRef.current, []),
    pick: useCallback((x: number, y: number, width: number, height: number) => {
      const scene = sceneRef.current;
      const camera = cameraRef.current;
      if (!scene || !camera) return null;
      const ndc = new Vector2((x / width) * 2 - 1, 1 - (y / height) * 2);
      return scene.pick(ndc.x, ndc.y, camera);
    }, []),
  };
}
