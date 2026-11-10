// The turntable beside the globe, in its own canvas: the toon deck from a fixed camera above and in front, the arm on
// the needle's groove, the record turning with the Earth. Plain three.js, no post chain: the deck is flat-shaded and the
// record's data (DeckView step 2) is drawn unlit, so the canvas's own sRGB output gives exact colours.

import { Box3, Color, DirectionalLight, Mesh, PerspectiveCamera, Plane, PlaneGeometry, Raycaster, Scene, Vector2, Vector3, WebGLRenderer } from "three";
import type { TrackMode } from "@/lib/audio-jukebox/types";
import type { LiveFields } from "@/lib/data";
import type { Palette } from "@/lib/css-tokens";
import { CAMERA } from "../canvas-config";
import { ARM_REST, createDeck, GROOVES, grooveTip, RECORD_TOP, tipAngle, type Deck } from "../scene/deck";

const raycaster = new Raycaster();
/** The record's data disc lies just above the vinyl; picks meet it there (not at the vinyl), or they'd shift by a sub-pixel. */
const DATA_DISC_Y = RECORD_TOP + 0.0015;
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

  // The Earth as grooves: a flat disc on the record, turning with it (record-texture.ts).
  const recordData = createRecordData(palette);
  const recordGeometry = new PlaneGeometry(2 * GROOVES.outer, 2 * GROOVES.outer).rotateX(-Math.PI / 2);
  const recordDisc = new Mesh(recordGeometry, recordData.material);
  recordDisc.position.y = DATA_DISC_Y;
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
      tip = tipFor(pose);
      deck.setArm(tip, UP);
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
      const disc = new Plane(new Vector3(0, 1, 0), -(DATA_DISC_Y + deck.record.position.y));
      const hit = raycaster.ray.intersectPlane(disc, new Vector3());
      if (!hit) return null;
      deck.record.updateMatrixWorld(true);
      const local = deck.record.worldToLocal(hit);
      const r = Math.hypot(local.x, local.z);
      if (r < GROOVES.inner || r > GROOVES.outer) return null;
      return { lat: -90 + ((r - GROOVES.inner) / (GROOVES.outer - GROOVES.inner)) * 180, lon: (Math.atan2(local.x, local.z) * 180) / Math.PI };
    },
    project(lat, lon) {
      const p = recordPoint(lat, lon);
      const world = new Vector3(p.x, DATA_DISC_Y, p.z);
      deck.record.updateMatrixWorld(true);
      world.applyMatrix4(deck.record.matrixWorld).project(camera);
      return { x: ((world.x + 1) / 2) * width, y: ((1 - world.y) / 2) * height };
    },
    hideArm(hidden) {
      deck.arm.visible = !hidden;
    },
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
      deck.dispose();
      renderer.dispose();
    },
  };
}
