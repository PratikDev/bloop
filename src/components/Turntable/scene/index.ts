// The Turntable Earth scene: flat globe + data frame + overlays on a cel-shaded
// turntable in space. The globe spins about its polar axis; the needle
// stays at one azimuth, so the longitude under it is set by the spin and its
// latitude is the groove. Every position goes through latLonToSphere.
// React Three Fiber owns the renderer, camera and scene (TurntableCanvas.tsx);
// this module builds the objects and the API the Turntable's loop drives.
// The 3D scenes (records on the carousel) live in src/components/Scenes/; the
// ones that need new data are typed hooks in Scenes/future.ts.

import {
  Color,
  DirectionalLight,
  Group,
  type Object3D,
  Raycaster,
  Sphere,
  Vector2,
  Vector3,
  type PerspectiveCamera,
  type Scene,
  type WebGLRenderer,
} from "three";
import type { Palette } from "@/lib/css-tokens";
import type { LatLon } from "@/lib/data";
import { latLonToSphere, sphereHitToLatLon } from "@/lib/sphere";
import { createSpin, stepSpin } from "@/lib/spin";
import type { GlobeFit } from "../fit";
import type { LayerToggles } from "../settings";
import { createCameraRig, DISTANCE, type CameraRig } from "./camera";
import { ARM_REST, createDeck, type Deck } from "./deck";
import { createEarth, EARTH_RADIUS, type Earth } from "./earth";
import { createEffects, type Effects } from "./effects";
import { createOverlays, type Overlays } from "./overlays";
import { asOccluder } from "./layers";
import { createPost } from "./post";
import { createStudio, type Studio } from "./studio";

/** Where the needle sits, as an azimuth on the unturned globe (front right, so the camera sees it). */
export const NEEDLE_AZIMUTH_DEG = 35;
const MAX_ANISOTROPY = 8;
const RAD = Math.PI / 180;
/**
 * The camera's distance from the needle's tip at which the tonearm is drawn at its size on the deck (the Explore view's
 * starting distance). Closer than this it shrinks about the tip, so up close it keeps its size on screen and still
 * touches the globe, instead of filling the view or passing behind the camera.
 */
const ARM_FULL_SIZE_REACH = DISTANCE.explore - EARTH_RADIUS;
const RECORD_LIFT = 0.7;
/** Camera height above the surface in the Jukebox view (globe radii), the reference for effect sizes. */
const JUKEBOX_HEIGHT = 4.2;
/** three's light units: at pi a surface facing the light shows its exact colour. */
const FULL_LIGHT = Math.PI;
/** Silhouette points for the debug check that no panel touches the globe. */
const DISC_SAMPLES = 72;

/** A globe point projected to CSS pixels; `facing` > 0 when it is on the side facing the camera. */
export interface ScreenPoint {
  x: number;
  y: number;
  facing: number;
}

/** What R3F hands the scene. */
export interface SceneHost {
  renderer: WebGLRenderer;
  scene: Scene;
  camera: PerspectiveCamera;
  /** R3F's manual frame (the Canvas runs with frameloop="never"). */
  advance(timestamp: number): void;
}

export interface TurntableScene {
  earth: Earth;
  overlays: Overlays;
  effects: Effects;
  deck: Deck;
  studio: Studio;
  rig: CameraRig;
  /** Turns the globe so `lon` is under the needle, needle on `lat`, lifted by `lift`, parked by `park` (0..1). */
  setPose(lat: number, lon: number, lift: number, park: number): void;
  /** What the needle reads: the globe point under its tip, back through sphereHitToLatLon. */
  readNeedle(): LatLon;
  /** The globe point under a canvas position (normalised device coordinates), or null off the globe. */
  pick(ndc: Vector2): LatLon | null;
  needleNdc(): Vector2;
  /** Where a lat/lon on the surface appears on screen now. */
  project(lat: number, lon: number): ScreenPoint;
  /** The needle point on screen. */
  projectNeedle(): ScreenPoint;
  /** The globe point straight below the camera (the centre of what's in view). */
  viewCenter(): LatLon;
  setRecordLift(t: number): void;
  /** Sun direction in the globe's frame (null = always day): the land's two light steps. */
  setSun(dir: Vector3 | null): void;
  /** Where the globe's disc should sit (the free space between the panels). */
  setFit(fit: GlobeFit, width: number, height: number): void;
  /** Points on the globe's outline as seen now, in CSS pixels (debug and verification). */
  discOutline(): { x: number; y: number }[];
  /** The pointer as drawn now: the stylus tip and the contact swatch (debug and the zoom regression test). */
  pointer(): { arm: PointerPart; swatch: PointerPart; blend: number };
  /** Size in CSS pixels (R3F sizes the canvas; this keeps projection and the post chain in step). */
  resize(width: number, height: number): void;
  /** Advance camera and effects by dt seconds; returns the number of particles spawned. */
  update(dt: number, opts: { instant: boolean; layers: LayerToggles; spinning: boolean }): number;
  /** Renders one frame: R3F's advance, which runs `draw` and drei's helpers. */
  render(): void;
  /** Draws one frame through the post chain (called from R3F's frame, see TurntableCanvas). */
  draw(dt: number): void;
  dispose(): void;
}

/** One part of the pointer: drawn (it and every parent visible), in front of the near plane, inside the view, and where (CSS px). */
export interface PointerPart {
  visible: boolean;
  inFront: boolean;
  onScreen: boolean;
  x: number;
  y: number;
}

const drawn = (o: Object3D | null): boolean => (o === null ? true : o.visible && drawn(o.parent));

export function createTurntableScene(host: SceneHost, dataCanvas: HTMLCanvasElement, palette: Palette): TurntableScene {
  const { renderer, scene, camera } = host;
  // three logs every shader compiler note. Checked in development, quiet in production builds.
  renderer.debug.checkShaderErrors = process.env.NODE_ENV !== "production";

  const key = new DirectionalLight(new Color(1, 1, 1), FULL_LIGHT);
  key.position.set(3, 5, 4);
  const rig = createCameraRig(camera);
  const anisotropy = Math.min(MAX_ANISOTROPY, renderer.capabilities.getMaxAnisotropy());
  const earth = createEarth(palette, dataCanvas, anisotropy);
  const overlays = createOverlays(palette);
  const deck = createDeck(palette);
  const effects = createEffects(palette);
  const studio = createStudio(palette, { exact: true });
  studio.setStars(1);
  const globe = new Group();
  globe.add(earth.surface, overlays.group);
  const root = new Group();
  root.add(key, studio.group, globe, effects.group, deck.group);
  // The exact sky is drawn in the overlay pass: the deck has to hold it back there, as the globe does.
  asOccluder(deck.group);
  scene.add(root);

  const post = createPost(renderer, scene, camera);

  const globeSphere = new Sphere(new Vector3(), EARTH_RADIUS);
  const raycaster = new Raycaster();
  const needleNormal = new Vector3(0, 0, 1);
  const tip = new Vector3();
  const local = new Vector3();
  const world = new Vector3();
  const toCamera = new Vector3();
  let width = 1;
  let height = 1;
  const platterSpin = createSpin();

  const toScreen = (p: Vector3, normal: Vector3): ScreenPoint => {
    toCamera.copy(camera.position).sub(p).normalize();
    const facing = normal.dot(toCamera);
    const ndc = p.clone().project(camera);
    return { x: ((ndc.x + 1) / 2) * width, y: ((1 - ndc.y) / 2) * height, facing };
  };

  return {
    earth,
    overlays,
    effects,
    deck,
    studio,
    rig,
    setPose(lat, lon, lift, park) {
      const spin = (NEEDLE_AZIMUTH_DEG - lon) * RAD;
      globe.rotation.y = spin;
      globe.updateMatrixWorld();
      const n = latLonToSphere(lat, NEEDLE_AZIMUTH_DEG);
      needleNormal.set(n.x, n.y, n.z);
      tip.copy(needleNormal).multiplyScalar(EARTH_RADIUS + lift);
      if (park > 0) tip.lerp(ARM_REST, park).addScaledVector(new Vector3(0, 1, 0), Math.sin(park * Math.PI) * 0.25);
      deck.setArm(tip, needleNormal);
      effects.setGroove(lat);
      effects.setNeedle(needleNormal.clone().multiplyScalar(EARTH_RADIUS), needleNormal);
    },
    readNeedle() {
      local.copy(needleNormal).multiplyScalar(EARTH_RADIUS);
      return sphereHitToLatLon(globe.worldToLocal(local));
    },
    pick(ndc) {
      raycaster.setFromCamera(ndc, camera);
      const hit = raycaster.ray.intersectSphere(globeSphere, new Vector3());
      return hit ? sphereHitToLatLon(globe.worldToLocal(hit)) : null;
    },
    needleNdc() {
      const p = needleNormal.clone().multiplyScalar(EARTH_RADIUS).project(camera);
      return new Vector2(p.x, p.y);
    },
    project(lat, lon) {
      const s = latLonToSphere(lat, lon, EARTH_RADIUS);
      world.set(s.x, s.y, s.z).applyMatrix4(globe.matrixWorld);
      return toScreen(world, world.clone().normalize());
    },
    projectNeedle() {
      return toScreen(needleNormal.clone().multiplyScalar(EARTH_RADIUS), needleNormal);
    },
    viewCenter() {
      return sphereHitToLatLon(globe.worldToLocal(camera.position.clone()));
    },
    setRecordLift(t) {
      deck.record.position.y = t * RECORD_LIFT;
      deck.record.rotation.z = t * 0.25;
    },
    setSun(dir) {
      earth.setSun(dir);
    },
    setFit(fit, w, h) {
      rig.setFit(fit, w, h);
    },
    pointer() {
      const part = (o: Object3D, at: Vector3): PointerPart => {
        const view = at.clone().applyMatrix4(camera.matrixWorldInverse);
        const ndc = at.clone().project(camera);
        return {
          visible: drawn(o),
          inFront: -view.z > camera.near,
          onScreen: Math.abs(ndc.x) <= 1 && Math.abs(ndc.y) <= 1,
          x: ((ndc.x + 1) / 2) * width,
          y: ((1 - ndc.y) / 2) * height,
        };
      };
      return { arm: part(deck.arm, tip), swatch: part(effects.swatch, effects.swatch.getWorldPosition(new Vector3())), blend: rig.blend() };
    },
    discOutline() {
      const d = camera.position.length();
      const axis = camera.position.clone().normalize();
      const side = new Vector3(0, 1, 0).cross(axis).normalize();
      const up = axis.clone().cross(side);
      const ring = Math.sqrt(1 - 1 / (d * d));
      return Array.from({ length: DISC_SAMPLES }, (_, i) => {
        const a = (i / DISC_SAMPLES) * 2 * Math.PI;
        const p = axis.clone().multiplyScalar(1 / d).addScaledVector(side, ring * Math.cos(a)).addScaledVector(up, ring * Math.sin(a));
        const s = toScreen(p, p);
        return { x: s.x, y: s.y };
      });
    },
    resize(w, h) {
      width = w;
      height = h;
      post.setSize(w, h);
    },
    update(dt, { instant, layers, spinning }) {
      if (!instant) {
        stepSpin(platterSpin, spinning, dt);
        deck.platter.rotation.y = -platterSpin.angle;
      }
      rig.update(dt, needleNormal, instant);
      const blend = rig.blend();
      overlays.setVisibility({ distance: blend > 0.5 ? rig.distance() : Infinity, ...layers });
      deck.setArmScale(Math.min(1, camera.position.distanceTo(tip) / ARM_FULL_SIZE_REACH), tip);
      // The camera's height above the surface, relative to the Jukebox view: effects keep their screen size.
      const zoom = Math.min(1, Math.max(0.03, (camera.position.length() - EARTH_RADIUS) / JUKEBOX_HEIGHT));
      world.copy(needleNormal).multiplyScalar(EARTH_RADIUS);
      const worldPerPx = (2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.distanceTo(world)) / Math.max(1, height);
      return effects.update(dt, zoom, worldPerPx);
    },
    render() {
      host.advance(performance.now());
    },
    draw(dt) {
      post.render(dt);
    },
    dispose() {
      scene.remove(root);
      post.dispose();
      earth.dispose();
      overlays.dispose();
      effects.dispose();
      deck.dispose();
      studio.dispose();
    },
  };
}

export { DISTANCE, type CameraMode } from "./camera";
