// Two camera poses with eased blending between them: Jukebox (the whole
// turntable, three-quarter view) and Explore (looking straight down the needle,
// zoomable to district level). The intro glides into the Jukebox pose from a
// wide product shot. Either way the globe's disc is framed into the free space
// between the panels: the distance sets its size, a view offset its position,
// so the camera's rays (picking, the needle) stay exact.

import { Vector3, type PerspectiveCamera } from "three";
import type { GlobeFit } from "../fit";

export type CameraMode = "jukebox" | "explore";

/** Camera distance from the globe centre in Explore mode, in globe radii. */
export const DISTANCE = { min: 1.12, max: 5.2, explore: 4.2 } as const;
const JUKEBOX = { position: new Vector3(1.35, 1.55, 6.7), target: new Vector3(0.35, -0.38, 0) };
const WIDE = { position: new Vector3(4.2, 3.4, 13.5), target: new Vector3(0.35, -0.5, 0) };
const INTRO_SEC = 2.6;
/** The Jukebox camera comes no closer than this, however much room there is: the deck and the arm's pivot stay in the picture. */
const MIN_JUKEBOX_DISTANCE = 6.2;
const BLEND_SEC = 0.9;
const ZOOM_TIME_CONSTANT_SEC = 0.18;
const FIT_TIME_CONSTANT_SEC = 0.18;

const ease = (x: number) => x * x * (3 - 2 * x);

/** The camera distance at which a unit sphere's disc has `radius` px on a view `height` px tall. */
export function distanceForRadius(radius: number, height: number, fovDeg: number): number {
  const perUnit = height / (2 * Math.tan((fovDeg * Math.PI) / 360) * radius);
  return Math.sqrt(1 + perUnit * perUnit);
}

/** How far along `from - to` to stand so that the distance from the origin is `d`. */
function scaleForDistance(from: Vector3, to: Vector3, d: number): number {
  const v = from.clone().sub(to);
  const a = v.lengthSq();
  const b = 2 * to.dot(v);
  const c = to.lengthSq() - d * d;
  return (-b + Math.sqrt(Math.max(0, b * b - 4 * a * c))) / (2 * a);
}

export interface CameraRig {
  mode: CameraMode;
  setMode(mode: CameraMode): void;
  /** The distance being eased towards. */
  targetDistance(): number;
  /** Current distance (what the overlays use to choose detail). */
  distance(): number;
  /** A distance chosen by the user or a flight: holds until the framing is reset. */
  setDistance(d: number, immediate?: boolean): void;
  /** Back to the fitted framing. */
  resetFraming(): void;
  /** Where the globe's disc should sit on a stage of this size. */
  setFit(fit: GlobeFit, width: number, height: number): void;
  /** 0 = Jukebox, 1 = Explore (eased). */
  blend(): number;
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
  let distance: number = DISTANCE.explore;
  let target: number = DISTANCE.explore;
  let userDistance = false;
  let goal: GlobeFit | null = null;
  let fit: GlobeFit | null = null;
  let stage = { width: 1, height: 1 };
  const position = new Vector3();
  const lookAt = new Vector3();
  const explore = new Vector3();
  const jukebox = new Vector3();
  const jukeboxTarget = new Vector3();
  const last = new Vector3(Infinity, 0, 0);
  const centre = new Vector3();

  /** Slides the view so the globe's centre lands where the fit wants it (the rays stay the camera's own). */
  const placeDisc = (f: GlobeFit) => {
    const { width, height } = stage;
    const halfTan = Math.tan((camera.fov * Math.PI) / 360);
    centre.set(0, 0, 0).applyMatrix4(camera.matrixWorldInverse);
    const x = (width / 2) * (1 + centre.x / (-centre.z * halfTan * (width / height)));
    const y = (height / 2) * (1 - centre.y / (-centre.z * halfTan));
    camera.setViewOffset(width, height, x - f.cx, y - f.cy, width, height);
  };

  return {
    get mode() {
      return mode;
    },
    setMode(m) {
      mode = m;
      if (m === "jukebox") userDistance = false;
    },
    targetDistance: () => target,
    distance: () => distance,
    setDistance(d, immediate = false) {
      userDistance = true;
      target = Math.min(DISTANCE.max, Math.max(DISTANCE.min, d));
      if (immediate) distance = target;
    },
    resetFraming() {
      userDistance = false;
    },
    setFit(next, width, height) {
      goal = next;
      stage = { width, height };
      if (!fit) fit = { ...next };
    },
    blend: () => ease(b),
    startIntro() {
      intro = 0;
    },
    skipIntro() {
      intro = 1;
    },
    update(dt, needleDir, instant) {
      if (fit && goal) {
        const k = instant ? 1 : 1 - Math.exp(-dt / FIT_TIME_CONSTANT_SEC);
        fit.cx += (goal.cx - fit.cx) * k;
        fit.cy += (goal.cy - fit.cy) * k;
        fit.radius += (goal.radius - fit.radius) * k;
      }
      const fitted = fit ? distanceForRadius(fit.radius, stage.height, camera.fov) : JUKEBOX.position.length();
      if (!userDistance) target = Math.min(DISTANCE.max, Math.max(DISTANCE.min, fitted));

      const goalMode = mode === "explore" ? 1 : 0;
      b = instant ? goalMode : b + Math.sign(goalMode - b) * Math.min(Math.abs(goalMode - b), dt / BLEND_SEC);
      distance = instant ? target : target + (distance - target) * Math.exp(-dt / ZOOM_TIME_CONSTANT_SEC);
      const e = ease(b);
      explore.copy(needleDir).normalize().multiplyScalar(distance);
      intro = instant ? 1 : Math.min(1, intro + dt / INTRO_SEC);
      const glide = ease(intro);
      jukebox.lerpVectors(WIDE.position, JUKEBOX.position, glide);
      jukeboxTarget.lerpVectors(WIDE.target, JUKEBOX.target, glide);
      jukebox.sub(jukeboxTarget).multiplyScalar(scaleForDistance(JUKEBOX.position, JUKEBOX.target, Math.max(fitted, MIN_JUKEBOX_DISTANCE))).add(jukeboxTarget);
      position.lerpVectors(jukebox, explore, e);
      lookAt.lerpVectors(jukeboxTarget, new Vector3(), e);
      camera.position.copy(position);
      camera.up.set(0, 1, 0);
      camera.lookAt(lookAt);
      camera.updateMatrixWorld();
      if (fit) placeDisc(fit);
      const moved = position.distanceToSquared(last) > 1e-10;
      last.copy(position);
      return moved;
    },
  };
}
