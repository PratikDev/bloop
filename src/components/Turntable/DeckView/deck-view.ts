// The turntable beside the globe, in its own canvas: the toon deck from a fixed camera above and in front, the arm on
// the needle's groove, the record turning with the Earth. Plain three.js, no post chain: the deck is flat-shaded and the
// record's data (DeckView step 2) is drawn unlit, so the canvas's own sRGB output gives exact colours.

import { Box3, Color, DirectionalLight, PerspectiveCamera, Scene, Vector3, WebGLRenderer } from "three";
import type { Palette } from "@/lib/css-tokens";
import { CAMERA } from "../canvas-config";
import { ARM_REST, createDeck, grooveTip, tipAngle, type Deck } from "../scene/deck";
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
      deck.dispose();
      renderer.dispose();
    },
  };
}
