// Two camera poses with eased blending between them: Jukebox (the whole
// turntable, three-quarter view) and Explore (looking straight down the needle,
// globe filling most of the view, zoomable to district level). The intro glides
// into the Jukebox pose from a wide product shot.

import { Vector3, type PerspectiveCamera } from "three";

export type CameraMode = "jukebox" | "explore";

/** Camera distance from the globe centre in Explore mode, in globe radii. */
export const DISTANCE = { min: 1.12, max: 5.2, explore: 4.2 } as const;
const JUKEBOX = { position: new Vector3(1.35, 1.55, 6.7), target: new Vector3(0.35, -0.38, 0) };
const WIDE = { position: new Vector3(4.2, 3.4, 13.5), target: new Vector3(0.35, -0.5, 0) };
const INTRO_SEC = 2.6;
/** Below this width/height the Jukebox camera backs off (up to MAX_PULL_BACK) to keep the deck in frame. */
const WIDE_ASPECT = 1.35;
const MAX_PULL_BACK = 2.2;
const PORTRAIT_AIM_DROP = 1.4;
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
  /** Narrow (portrait) views pull the Jukebox camera back so the whole turntable fits. */
  setAspect(aspect: number): void;
  /** The intro's glide from the wide shot (skip ends it at once). */
  startIntro(): void;
  skipIntro(): void;
  /** Moves the camera; returns true if it moved. */
  update(dt: number, needleDir: Vector3, instant: boolean): boolean;
}

export function createCameraRig(camera: PerspectiveCamera): CameraRig {
  let mode: CameraMode = "jukebox";
  let b = 0;
  let intro = 1; // 0..1; 1 = no intro running
  let pullBack = 1;
  let distance: number = DISTANCE.explore;
  let target: number = DISTANCE.explore;
  const position = new Vector3();
  const lookAt = new Vector3();
  const explore = new Vector3();
  const jukebox = new Vector3();
  const jukeboxTarget = new Vector3();
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
    setAspect(aspect) {
      pullBack = Math.min(MAX_PULL_BACK, Math.max(1, WIDE_ASPECT / aspect));
    },
    startIntro() {
      intro = 0;
    },
    skipIntro() {
      intro = 1;
    },
    update(dt, needleDir, instant) {
      const goal = mode === "explore" ? 1 : 0;
      b = instant ? goal : b + Math.sign(goal - b) * Math.min(Math.abs(goal - b), dt / BLEND_SEC);
      distance = instant ? target : target + (distance - target) * Math.exp(-dt / ZOOM_TIME_CONSTANT_SEC);
      const e = ease(b);
      explore.copy(needleDir).normalize().multiplyScalar(distance);
      intro = instant ? 1 : Math.min(1, intro + dt / INTRO_SEC);
      const glide = ease(intro);
      jukebox.lerpVectors(WIDE.position, JUKEBOX.position, glide);
      jukeboxTarget.lerpVectors(WIDE.target, JUKEBOX.target, glide);
      jukebox.sub(jukeboxTarget).multiplyScalar(pullBack).add(jukeboxTarget);
      // Portrait: aim lower, so the deck sits in the upper part of the view (the controls cover the bottom).
      jukeboxTarget.y -= (pullBack - 1) * PORTRAIT_AIM_DROP;
      position.lerpVectors(jukebox, explore, e);
      lookAt.lerpVectors(jukeboxTarget, new Vector3(), e);
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
