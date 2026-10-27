// The Turntable Earth scene: realistic globe + data frame + overlays on a PBR
// turntable in a warm studio. The globe spins about its polar axis; the needle
// stays at one azimuth, so the longitude under it is set by the spin and its
// latitude is the groove. Every position goes through latLonToSphere.
// TODO(turntable: more scenes): the Amphan cold scar, the playable delta and the
// satellite orrery would be sibling scenes reusing latLonToSphere and the deck.

import {
  AmbientLight,
  Color,
  DirectionalLight,
  Group,
  PerspectiveCamera,
  PMREMGenerator,
  Raycaster,
  Scene,
  Sphere,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import type { Palette } from "@/lib/css-tokens";
import type { LatLon } from "@/lib/data";
import { latLonToSphere, sphereHitToLatLon } from "@/lib/sphere";
import { createCameraRig, type CameraRig } from "./camera";
import { ARM_REST, createDeck, type Deck } from "./deck";
import { studioBackdrop } from "./deck-textures";
import { createEarth, EARTH_RADIUS, type Earth } from "./earth";
import { createEffects, type Effects } from "./effects";
import { createOverlays, type Overlays } from "./overlays";

/** Where the needle sits, as an azimuth on the unturned globe (front right, so the camera sees it). */
export const NEEDLE_AZIMUTH_DEG = 35;
const MAX_PIXEL_RATIO = 2;
const MAX_ANISOTROPY = 8;
const FOV = 30;
const RAD = Math.PI / 180;
/** Above this Explore blend the tonearm is hidden and the crosshair marks the needle. */
const ARM_HIDDEN_ABOVE = 0.55;
const RECORD_LIFT = 0.7;
/** Camera height above the surface in the Jukebox view (globe radii), the reference for effect sizes. */
const JUKEBOX_HEIGHT = 4.2;

/** A globe point projected to CSS pixels; `facing` > 0 when it is on the side facing the camera. */
export interface ScreenPoint {
  x: number;
  y: number;
  facing: number;
}

export interface TurntableScene {
  earth: Earth;
  overlays: Overlays;
  effects: Effects;
  deck: Deck;
  rig: CameraRig;
  maxTextureSize: number;
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
  resize(width: number, height: number): void;
  /** Advance camera and effects by dt seconds; returns the number of particles spawned. */
  update(dt: number, opts: { instant: boolean; graticule: boolean }): number;
  render(): void;
  dispose(): void;
}

export function createTurntableScene(canvas: HTMLCanvasElement, dataCanvas: HTMLCanvasElement, palette: Palette): TurntableScene {
  const renderer = new WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO));
  // three logs every shader compiler note; Windows' D3D compiler adds harmless precision notes on
  // three's own PBR shaders. Checked in development, quiet in production builds.
  renderer.debug.checkShaderErrors = process.env.NODE_ENV !== "production";
  const pmrem = new PMREMGenerator(renderer);
  const environment = pmrem.fromScene(new RoomEnvironment(), 0.04);

  const scene = new Scene();
  const backdrop = studioBackdrop(palette["studio-top"], palette["studio-bottom"]);
  scene.background = backdrop;
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.55;
  const key = new DirectionalLight(new Color(palette["sun-glint"]), 1.3);
  key.position.set(3, 5, 4);
  scene.add(new AmbientLight(new Color(palette.moon), 0.15), key);

  const camera = new PerspectiveCamera(FOV, 1, 0.02, 60);
  const rig = createCameraRig(camera);

  const earth = createEarth(palette, dataCanvas, Math.min(MAX_ANISOTROPY, renderer.capabilities.getMaxAnisotropy()));
  const overlays = createOverlays(palette);
  const effects = createEffects(palette);
  const deck = createDeck(palette);
  const globe = new Group();
  globe.add(earth.surface, overlays.group);
  scene.add(globe, earth.atmosphere, effects.group, deck.group);

  const globeSphere = new Sphere(new Vector3(), EARTH_RADIUS);
  const raycaster = new Raycaster();
  const needleNormal = new Vector3(0, 0, 1);
  const tip = new Vector3();
  const local = new Vector3();
  const world = new Vector3();
  const toCamera = new Vector3();
  const cameraLocal = new Vector3();
  let width = 1;
  let height = 1;

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
    rig,
    maxTextureSize: renderer.capabilities.maxTextureSize,
    setPose(lat, lon, lift, park) {
      const spin = (NEEDLE_AZIMUTH_DEG - lon) * RAD;
      globe.rotation.y = spin;
      deck.platter.rotation.y = spin;
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
    resize(w, h) {
      width = w;
      height = h;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    },
    update(dt, { instant, graticule }) {
      rig.update(dt, needleNormal, instant);
      cameraLocal.copy(camera.position);
      earth.setCameraLocal(globe.worldToLocal(cameraLocal));
      overlays.setVisibility({ distance: rig.blend() > 0.5 ? rig.distance() : Infinity, graticule });
      deck.arm.visible = rig.blend() < ARM_HIDDEN_ABOVE;
      // The camera's height above the surface, relative to the Jukebox view: effects keep their screen size.
      const zoom = Math.min(1, Math.max(0.03, (camera.position.length() - EARTH_RADIUS) / JUKEBOX_HEIGHT));
      return effects.update(dt, zoom);
    },
    render() {
      renderer.render(scene, camera);
    },
    dispose() {
      earth.dispose();
      overlays.dispose();
      effects.dispose();
      deck.dispose();
      backdrop.dispose();
      environment.dispose();
      pmrem.dispose();
      renderer.dispose();
      deck.releaseSharedTextures();
      renderer.forceContextLoss();
    },
  };
}

export { DISTANCE, type CameraMode } from "./camera";
