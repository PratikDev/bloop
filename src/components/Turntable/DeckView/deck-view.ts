// The turntable beside the globe, in its own canvas: the toon deck from a fixed camera above and in front, the arm on
// the needle's groove, the record turning with the Earth. Plain three.js, no post chain: the deck is flat-shaded and the
// record's data (DeckView step 2) is drawn unlit, so the canvas's own sRGB output gives exact colours.

import { Box3, Color, DirectionalLight, Mesh, PerspectiveCamera, Plane, PlaneGeometry, Raycaster, Scene, Vector2, Vector3, WebGLRenderer } from "three";
import type { TrackMode } from "@/lib/audio-jukebox/types";
import type { LiveFields } from "@/lib/data";
import type { Palette } from "@/lib/css-tokens";
import { CAMERA } from "../canvas-config";
import { ARM_REST, createDeck, createToonKit, GROOVES, grooveTip, RECORD_TOP, tipAngle, type Deck } from "../scene/deck";
import { createHardware, type Hardware, type HardwareId, type HardwareState } from "./hardware";

const raycaster = new Raycaster();
const recordPlane = new Plane(new Vector3(0, 1, 0), -RECORD_TOP);
import { createRecordData, recordPoint } from "./record-texture";
import type { DeckPose } from "../use-turntable";

const RAD = Math.PI / 180;
/** The camera looks down at the deck from this high (degrees above the plinth): the record reads as a near-circle. */
const ELEVATION_DEG = 55;
/** How much of the canvas the deck may fill (NDC), so its outline never touches the edge. */
const FILL = 0.94;
/** three's light units: at pi a surface facing the light shows its exact colour (as the globe's scene). */
const FULL_LIGHT = Math.PI;
const UP = new Vector3(0, 1, 0);
/** How high a lift of 1 raises the stylus off the record, in deck units. */
const LIFT_HEIGHT = 0.5;
/** The stylus trembles with the sound by at most this much on screen, this many times a second. */
const TREMBLE = { px: 1, hz: 9 } as const;
/** The grille's pulse at the loudest low band: 1 → 1.04. */
const GRILLE_PULSE = 0.04;

/** The sound's levels for the grille and the stylus, each 0..1 in 4 steps (null: no sound, or reduced motion). */
export interface DeckLevels {
  low: number;
  overall: number;
}

/** One part of the pointer as drawn now, in CSS px inside the canvas. */
export interface DeckPart {
  visible: boolean;
  inFront: boolean;
  onScreen: boolean;
  x: number;
  y: number;
}

export interface DeckView {
  /** Places the arm and turns the record for this pose, then draws. */
  update(pose: DeckPose): void;
  resize(width: number, height: number, dpr: number): void;
  /** The stylus tip as drawn now (debug and the zoom regression test). */
  stylus(): DeckPart;
  /** The record's data (record-texture.ts): the frame's images read unsmoothed at each point, so its colours are their own. */
  setRecord(fields: LiveFields, track: TrackMode, images: { sst: HTMLImageElement | null; rain: HTMLImageElement | null }): void;
  setLabel(canvas: HTMLCanvasElement): void;
  /** The record's latitude and longitude under a point of the canvas (CSS px), or null off the grooves. */
  pick(x: number, y: number): { lat: number; lon: number } | null;
  /** Debug: where a point of the record (a latitude and longitude) is on screen now, in CSS px inside the canvas. */
  project(lat: number, lon: number): { x: number; y: number };
  /** Debug: hides the arm, so a check can read the record's own pixel under the needle. */
  hideArm(hidden: boolean): void;
  /** The hardware mirrors its DOM controls' state (hardware.ts). */
  setHardware(state: HardwareState): void;
  /** The grille's pulse and the stylus's tremble follow these (null: both still). */
  setLevels(levels: DeckLevels | null): void;
  /** The hardware piece under a point of the canvas (CSS px), or null: a pointer handler checks this first. */
  hardwareAt(x: number, y: number): HardwareId | null;
  /** A piece's smaller side on screen, in CSS px (under 44 px it's visual only to a finger). */
  hardwareSize(id: HardwareId): number;
  /** Debug: a piece's centre on screen (CSS px inside the canvas), what the hardware shows now, and the stylus as drawn. */
  hardwareCentre(id: HardwareId): { x: number; y: number };
  hardwareShown(): ReturnType<Hardware["shown"]> & { tremblePx: number };
  dispose(): void;
}

/** Where the arm's tip goes: on the latitude's groove, lifted by `lift`, swung to its rest by `park` (0..1). */
function tipFor(pose: DeckPose): Vector3 {
  const tip = grooveTip(pose.lat).addScaledVector(UP, pose.lift * LIFT_HEIGHT);
  if (pose.park > 0) tip.lerp(ARM_REST, pose.park).addScaledVector(UP, Math.sin(pose.park * Math.PI) * 0.15);
  return tip;
}

/** The deck's box with the arm at every place it can be (the innermost and outermost grooves, and at rest). */
function deckBounds(deck: Deck): Box3 {
  const box = new Box3();
  for (const lat of [-90, 0, 90]) {
    deck.setArm(grooveTip(lat), UP);
    deck.group.updateMatrixWorld(true);
    box.union(new Box3().setFromObject(deck.group));
  }
  deck.setArm(ARM_REST.clone(), UP);
  deck.group.updateMatrixWorld(true);
  return box.union(new Box3().setFromObject(deck.group));
}

export function createDeckView(canvas: HTMLCanvasElement, palette: Palette): DeckView {
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  renderer.setClearColor(new Color(0, 0, 0), 0);
  const scene = new Scene();
  const camera = new PerspectiveCamera(CAMERA.fov, 1, CAMERA.near, CAMERA.far);
  const key = new DirectionalLight(new Color(1, 1, 1), FULL_LIGHT);
  key.position.set(3, 5, 4);
  const deck = createDeck(palette);
  scene.add(key, deck.group);
  // The hardware on the plinth, inside the deck's bounds so the camera keeps it in frame.
  const hardwareKit = createToonKit(palette);
  const hardware = createHardware(hardwareKit, palette);
  deck.group.add(hardware.group);
  let levels: DeckLevels | null = null;
  let last = performance.now();
  let tremblePx = 0;

  // The Earth as grooves: a flat disc on the record, turning with it (record-texture.ts).
  const recordData = createRecordData(palette);
  const recordGeometry = new PlaneGeometry(2 * GROOVES.outer, 2 * GROOVES.outer).rotateX(-Math.PI / 2);
  const recordDisc = new Mesh(recordGeometry, recordData.material);
  recordDisc.position.y = RECORD_TOP + 0.0015;
  deck.record.add(recordDisc);

  const bounds = deckBounds(deck);
  const centre = bounds.getCenter(new Vector3());
  const corners = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => new Vector3(i & 1 ? bounds.max.x : bounds.min.x, i & 2 ? bounds.max.y : bounds.min.y, i & 4 ? bounds.max.z : bounds.min.z));
  const view = new Vector3(0, Math.sin(ELEVATION_DEG * RAD), Math.cos(ELEVATION_DEG * RAD));
  let width = 1;
  let height = 1;
  let tip = grooveTip(0);

  /** The nearest camera that keeps every corner of the deck inside the canvas. */
  const frame = () => {
    camera.aspect = width / height;
    let near = 1;
    let far = 40;
    for (let i = 0; i < 30; i++) {
      const d = (near + far) / 2;
      camera.position.copy(centre).addScaledVector(view, d);
      camera.lookAt(centre);
      camera.updateMatrixWorld();
      camera.updateProjectionMatrix();
      const fits = corners.every((c) => {
        const p = c.clone().project(camera);
        return Math.abs(p.x) <= FILL && Math.abs(p.y) <= FILL && p.z < 1;
      });
      if (fits) far = d;
      else near = d;
    }
    camera.position.copy(centre).addScaledVector(view, far);
    camera.lookAt(centre);
    camera.updateMatrixWorld();
    camera.updateProjectionMatrix();
  };

  return {
    update(pose) {
      const now = performance.now();
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      hardware.step(dt, pose.instant);
      tip = tipFor(pose);
      // The tremble and the pulse: only while sound plays, never under reduced motion.
      const live = levels && pose.spinning && !pose.instant ? levels : null;
      hardware.setGrille(1 + GRILLE_PULSE * (live?.low ?? 0));
      const drawn = tip.clone();
      tremblePx = 0;
      if (live && live.overall > 0) {
        const worldPerPx = (2 * Math.tan((camera.fov * RAD) / 2) * camera.position.distanceTo(tip)) / height;
        tremblePx = live.overall * TREMBLE.px * Math.sin((now / 1000) * 2 * Math.PI * TREMBLE.hz);
        drawn.x += tremblePx * worldPerPx;
      }
      deck.setArm(drawn, UP);
      // The record turns with the Earth: the needle's longitude is under the tip (x = sin, z = cos, as lib/sphere).
      deck.record.rotation.y = tipAngle(pose.lat) - pose.lon * RAD;
      deck.record.position.y = pose.recordLift * 0.6;
      renderer.render(scene, camera);
    },
    resize(w, h, dpr) {
      width = Math.max(1, w);
      height = Math.max(1, h);
      renderer.setPixelRatio(dpr);
      renderer.setSize(width, height, false);
      frame();
    },
    setRecord(fields, track, images) {
      recordData.set(fields, track, images);
    },
    setLabel(canvas) {
      deck.setLabel(canvas);
    },
    pick(x, y) {
      raycaster.setFromCamera(new Vector2((x / width) * 2 - 1, 1 - (y / height) * 2), camera);
      const hit = raycaster.ray.intersectPlane(recordPlane, new Vector3());
      if (!hit) return null;
      deck.record.updateMatrixWorld(true);
      const local = deck.record.worldToLocal(hit.setY(RECORD_TOP + deck.record.position.y));
      const r = Math.hypot(local.x, local.z);
      if (r < GROOVES.inner || r > GROOVES.outer) return null;
      return { lat: -90 + ((r - GROOVES.inner) / (GROOVES.outer - GROOVES.inner)) * 180, lon: (Math.atan2(local.x, local.z) * 180) / Math.PI };
    },
    project(lat, lon) {
      const p = recordPoint(lat, lon);
      const world = new Vector3(p.x, RECORD_TOP, p.z);
      deck.record.updateMatrixWorld(true);
      world.applyMatrix4(deck.record.matrixWorld).project(camera);
      return { x: ((world.x + 1) / 2) * width, y: ((1 - world.y) / 2) * height };
    },
    hideArm(hidden) {
      deck.arm.visible = !hidden;
    },
    setHardware(state) {
      hardware.setState(state);
    },
    setLevels(next) {
      levels = next;
    },
    hardwareAt(x, y) {
      raycaster.setFromCamera(new Vector2((x / width) * 2 - 1, 1 - (y / height) * 2), camera);
      const hit = raycaster.intersectObjects(hardware.targets, true)[0];
      return hit ? hardware.idOf(hit.object) : null;
    },
    hardwareSize(id) {
      const box = new Box3().setFromObject(hardware.piece(id));
      const xs: number[] = [];
      const ys: number[] = [];
      for (let i = 0; i < 8; i++) {
        const p = new Vector3(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z).project(camera);
        xs.push(((p.x + 1) / 2) * width);
        ys.push(((1 - p.y) / 2) * height);
      }
      return Math.min(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
    },
    hardwareCentre(id) {
      const p = new Box3().setFromObject(hardware.piece(id)).getCenter(new Vector3()).project(camera);
      return { x: ((p.x + 1) / 2) * width, y: ((1 - p.y) / 2) * height };
    },
    hardwareShown: () => ({ ...hardware.shown(), tremblePx }),
    stylus() {
      const view = tip.clone().applyMatrix4(camera.matrixWorldInverse);
      const ndc = tip.clone().project(camera);
      return {
        visible: deck.arm.visible && deck.group.visible,
        inFront: -view.z > camera.near,
        onScreen: Math.abs(ndc.x) <= 1 && Math.abs(ndc.y) <= 1,
        x: ((ndc.x + 1) / 2) * width,
        y: ((1 - ndc.y) / 2) * height,
      };
    },
    dispose() {
      recordData.dispose();
      recordGeometry.dispose();
      hardwareKit.dispose();
      deck.dispose();
      renderer.dispose();
    },
  };
}
