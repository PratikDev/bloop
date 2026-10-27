// Two camera poses with eased blending between them: Jukebox (the whole
// turntable, three-quarter view) and Explore (looking straight down the needle,
// globe filling most of the view, zoomable to district level).

import { Vector3, type PerspectiveCamera } from "three";

export type CameraMode = "jukebox" | "explore";

/** Camera distance from the globe centre in Explore mode, in globe radii. */
export const DISTANCE = { min: 1.12, max: 5.2, explore: 4.2 } as const;
const JUKEBOX = { position: new Vector3(0.85, 1.05, 5.0), target: new Vector3(0.3, -0.3, 0) };
const BLEND_SEC = 0.9;
const ZOOM_TIME_CONSTANT_SEC = 0.18;

const ease = (x: number) => x * x * (3 - 2 * x);

export interface CameraRig {
  mode: CameraMode;
  setMode(mode: CameraMode): void;
  /** The distance being eased towards. */
  targetDistance(): number;
  /** Current distance (what the overlays use to choose detail). */
  distance(): number;
  setDistance(d: number, immediate?: boolean): void;
  /** 0 = Jukebox, 1 = Explore (eased). */
  blend(): number;
  /** Moves the camera; returns true if it moved. */
  update(dt: number, needleDir: Vector3, instant: boolean): boolean;
}

export function createCameraRig(camera: PerspectiveCamera): CameraRig {
  let mode: CameraMode = "jukebox";
  let b = 0;
  let distance: number = DISTANCE.explore;
  let target: number = DISTANCE.explore;
  const position = new Vector3();
  const lookAt = new Vector3();
  const explore = new Vector3();
  const last = new Vector3(Infinity, 0, 0);

  return {
    get mode() {
      return mode;
    },
    setMode(m) {
      mode = m;
    },
    targetDistance: () => target,
    distance: () => distance,
    setDistance(d, immediate = false) {
      target = Math.min(DISTANCE.max, Math.max(DISTANCE.min, d));
      if (immediate) distance = target;
    },
    blend: () => ease(b),
    update(dt, needleDir, instant) {
      const goal = mode === "explore" ? 1 : 0;
      b = instant ? goal : b + Math.sign(goal - b) * Math.min(Math.abs(goal - b), dt / BLEND_SEC);
      distance = instant ? target : target + (distance - target) * Math.exp(-dt / ZOOM_TIME_CONSTANT_SEC);
      const e = ease(b);
      explore.copy(needleDir).normalize().multiplyScalar(distance);
      position.lerpVectors(JUKEBOX.position, explore, e);
      lookAt.lerpVectors(JUKEBOX.target, new Vector3(), e);
      camera.position.copy(position);
      camera.up.set(0, 1, 0);
      camera.lookAt(lookAt);
      camera.updateMatrixWorld();
      const moved = position.distanceToSquared(last) > 1e-10;
      last.copy(position);
      return moved;
    },
  };
}
