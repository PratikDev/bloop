// The Turntable Earth scene: realistic globe + data frame + overlays on a PBR
// turntable in a warm studio. The globe spins about its polar axis; the needle
// stays at one azimuth, so the longitude under it is set by the spin and its
// latitude is the groove. Every position goes through latLonToSphere.
// React Three Fiber owns the renderer, camera and scene (TurntableCanvas.tsx);
// this module builds the objects and the API the Turntable's loop drives.
// TODO(turntable: more scenes): the Amphan cold scar, the playable delta and the
// satellite orrery would be sibling scenes reusing latLonToSphere and the deck.

import {
  Color,
  DirectionalLight,
  Group,
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
import type { Tier } from "../quality";
import { createEarthTextureLoader, type EarthTextureLoader } from "../textures";
import { createCameraRig, type CameraRig } from "./camera";
import { ARM_REST, createDeck, type Deck } from "./deck";
import { createEarth, EARTH_RADIUS, type Earth, type EarthLook } from "./earth";
import { createEffects, type Effects } from "./effects";
import { createOverlays, type Overlays } from "./overlays";
import { createPost, type Post, type PostLook } from "./post";
import { createStudio, type Studio } from "./studio";

/** Where the needle sits, as an azimuth on the unturned globe (front right, so the camera sees it). */
export const NEEDLE_AZIMUTH_DEG = 35;
const MAX_ANISOTROPY = 8;
const RAD = Math.PI / 180;
/** Above this close-up blend the tonearm is hidden and the crosshair marks the needle. */
const ARM_HIDDEN_ABOVE = 0.55;
const RECORD_LIFT = 0.7;
/** Camera height above the surface in the Jukebox view (globe radii), the reference for effect sizes. */
const JUKEBOX_HEIGHT = 4.2;
/** The depth of field focuses a little in front of the globe's centre (its near face). */
const FOCUS_IN_FRONT = 0.6;

/** A globe point projected to CSS pixels; `facing` > 0 when it is on the side facing the camera. */
export interface ScreenPoint {
  x: number;
  y: number;
  facing: number;
}

/** The design knobs (look-dev and Settings), never data. */
export interface SceneLook {
  earth?: Partial<EarthLook>;
  post?: Partial<PostLook>;
}

export interface SceneInfo {
  tier: Tier;
  atmosphere: boolean;
  surface: ReturnType<Earth["textureInfo"]>;
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
  textures: EarthTextureLoader;
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
  /** Sun direction in the globe's frame (null = always day): the Earth's shading and the atmosphere. */
  setSun(dir: Vector3 | null): void;
  setLook(look: SceneLook): void;
  /** What is rendering now (debug and verification). */
  info(): SceneInfo;
  /** Rebuilds the post chain for a quality tier (textures are loaded separately). */
  setTier(tier: Tier): void;
  /** Size in CSS pixels (R3F sizes the canvas; this keeps projection and the post chain in step). */
  resize(width: number, height: number): void;
  /** Advance camera and effects by dt seconds; returns the number of particles spawned. */
  update(dt: number, opts: { instant: boolean; graticule: boolean }): number;
  /** Renders one frame: R3F's advance, which runs `draw` and drei's helpers. */
  render(): void;
  /** Draws one frame through the post chain (called from R3F's frame, see TurntableCanvas). */
  draw(dt: number): void;
  dispose(): void;
}

export function createTurntableScene(host: SceneHost, dataCanvas: HTMLCanvasElement, palette: Palette, tier: Tier): TurntableScene {
  const { renderer, scene, camera } = host;
  // three logs every shader compiler note; Windows' D3D compiler adds harmless precision notes on
  // three's own PBR shaders. Checked in development, quiet in production builds.
  renderer.debug.checkShaderErrors = process.env.NODE_ENV !== "production";

  const key = new DirectionalLight(new Color(palette["sun-glint"]), 0.7);
  key.position.set(3, 5, 4);
  const rig = createCameraRig(camera);
  const anisotropy = Math.min(MAX_ANISOTROPY, renderer.capabilities.getMaxAnisotropy());
  const earth = createEarth(palette, dataCanvas, anisotropy);
  const overlays = createOverlays(palette);
  const deck = createDeck(palette);
  const effects = createEffects(palette, deck.setStylusColor);
  const studio = createStudio(palette);
  const textures = createEarthTextureLoader(renderer);
  const globe = new Group();
  globe.add(earth.surface, overlays.group);
  const root = new Group();
  root.add(key, studio.group, globe, effects.group, deck.group);
  scene.add(root);

  let currentTier = tier;
  let post: Post = createPost(renderer, scene, camera, tier);
  post.setGlobe(globe);
  let sun: Vector3 | null = null;
  let postLook: Partial<PostLook> = {};

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
    studio,
    rig,
    textures,
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
    setSun(dir) {
      sun = dir;
      earth.setSun(dir);
      post.setSun(dir);
    },
    setLook(look) {
      if (look.earth) earth.setLook(look.earth);
      if (look.post) {
        postLook = { ...postLook, ...look.post };
        post.setLook(postLook);
      }
    },
    info: () => ({ tier: currentTier, atmosphere: post.atmosphereReady(), surface: earth.textureInfo() }),
    setTier(t) {
      currentTier = t;
      post.dispose();
      post = createPost(renderer, scene, camera, t);
      post.setGlobe(globe);
      post.setSun(sun);
      post.setLook(postLook);
      post.setSize(width, height);
    },
    resize(w, h) {
      width = w;
      height = h;
      post.setSize(w, h);
    },
    update(dt, { instant, graticule }) {
      rig.update(dt, needleNormal, instant);
      cameraLocal.copy(camera.position);
      earth.setCameraLocal(globe.worldToLocal(cameraLocal));
      const blend = rig.blend();
      overlays.setVisibility({ distance: blend > 0.5 ? rig.distance() : Infinity, graticule });
      deck.arm.visible = blend < ARM_HIDDEN_ABOVE;
      // Decoration steps aside in the close-up: clouds fade out, the stars come in.
      earth.setClouds(1 - blend);
      studio.setStars(blend);
      post.setViewBlend(blend, camera.position.length() - FOCUS_IN_FRONT);
      // The camera's height above the surface, relative to the Jukebox view: effects keep their screen size.
      const zoom = Math.min(1, Math.max(0.03, (camera.position.length() - EARTH_RADIUS) / JUKEBOX_HEIGHT));
      return effects.update(dt, zoom);
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
      textures.dispose();
      earth.dispose();
      overlays.dispose();
      effects.dispose();
      deck.dispose();
      studio.dispose();
      deck.releaseSharedTextures();
    },
  };
}

export { DISTANCE, type CameraMode } from "./camera";
