// The turntable around the globe, cel-shaded: a flat coral plinth with a navy
// outline and a hard offset shadow, a navy platter and record with drawn
// grooves, a paper label, and a paper-and-navy tonearm with a coral stylus.

import {
  BackSide,
  Box3,
  CanvasTexture,
  CatmullRomCurve3,
  CircleGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DataTexture,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshToonMaterial,
  NearestFilter,
  PlaneGeometry,
  Quaternion,
  RedFormat,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  TubeGeometry,
  Vector3,
  type BufferGeometry,
  type Material,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { Palette } from "@/lib/css-tokens";
import { grooveTexture } from "./deck-textures";
import { asOccluder } from "./layers";

const BASE = { size: new Vector3(4.6, 0.24, 3.8), center: new Vector3(0.35, -1.42, 0.1), bevel: 0.06 };
const TOP = { thickness: 0.05, bevel: 0.022 };
const PLATTER = { radius: 1.6, height: 0.06, y: -1.2 };
const RECORD = { radius: 1.5, height: 0.012, y: -1.164, labelRadius: 0.48 };
const SPINDLE = { radius: 0.03, bottom: -1.16, top: -1.09 };
const ROD_RADIUS = 0.012;
const PIVOT = new Vector3(2.15, 0.12, 0.95);
const ARM_RADIUS = 0.026;
/** The head sits well above the surface and the needle runs down to it, so the swatch at the contact point stays in view. */
const HEADSHELL_OFFSET = 0.24;
const NEEDLE_LENGTH = 0.22;
/** The three light steps of the cel shading (lit, half, shade), as 0..255. */
const TOON_STEPS = [178, 216, 255];
/** Inverted-hull outline widths, in scene units. */
const OUTLINE = { body: 0.022, arm: 0.011 };
/** How far the hard shadow falls from the plinth, towards the viewer's right. */
const SHADOW_OFFSET = 0.2;
/** The arm's flat shadow: just above the record, so it lies on the deck and the record alike. */
const ARM_SHADOW = { width: 0.05, y: RECORD.y + 0.02, offset: 0.09 };
/** Where the stylus rests while a record is changed (beside the globe). */
export const ARM_REST = new Vector3(1.55, -0.55, 1.35);

const UP = new Vector3(0, 1, 0);

export interface Deck {
  group: Group;
  /** Spins with the sound. */
  platter: Group;
  /** The record on the platter (lifted during a record change). */
  record: Group;
  /** The tonearm and stylus. */
  arm: Group;
  setArm(tip: Vector3, normal: Vector3): void;
  /** Shrinks the whole arm about the needle's tip (1 = its size on the deck), so it keeps its size on screen up close. */
  setArmScale(scale: number, tip: Vector3): void;
  setLabel(canvas: HTMLCanvasElement): void;
  dispose(): void;
}

function span(mesh: Mesh, from: Vector3, to: Vector3) {
  const dir = new Vector3().subVectors(to, from);
  mesh.position.copy(from).addScaledVector(dir, 0.5);
  mesh.scale.set(1, dir.length(), 1);
  mesh.quaternion.setFromUnitVectors(UP, dir.normalize());
}

function toonGradient(): DataTexture {
  const texture = new DataTexture(new Uint8Array(TOON_STEPS), TOON_STEPS.length, 1, RedFormat);
  texture.minFilter = NearestFilter;
  texture.magFilter = NearestFilter;
  texture.needsUpdate = true;
  return texture;
}

export function createDeck(palette: Palette): Deck {
  const geometries: BufferGeometry[] = [];
  const gradient = toonGradient();
  const grooves = grooveTexture(palette.platter, palette.groove);
  const toon = (color: string) => new MeshToonMaterial({ color: new Color(color), gradientMap: gradient });

  const materials = {
    side: toon(palette["deck-side"]),
    top: toon(palette["deck-top"]),
    platter: toon(palette.platter),
    grooved: new MeshToonMaterial({ map: grooves, gradientMap: gradient }),
    paper: toon(palette.arm),
    navy: toon(palette["arm-edge"]),
    head: toon(palette.stylus),
    label: new MeshToonMaterial({ gradientMap: gradient }),
    outline: new MeshBasicMaterial({ color: new Color(palette["arm-edge"]), side: BackSide }),
    shadow: new MeshBasicMaterial({ color: new Color(palette["shadow-on-space"]) }),
    armShadow: new MeshBasicMaterial({ color: new Color(palette["arm-edge"]) }),
  };
  const mesh = (geometry: BufferGeometry, material: Material | Material[]) => {
    geometries.push(geometry);
    return new Mesh(geometry, material);
  };

  /**
   * An inverted hull: a navy, back-faced copy grown by `width` on each side, drawn as a child so it
   * follows the mesh. Spanned meshes are stretched along y every frame, so they only grow around it.
   */
  const outline = (target: Mesh, width: number, spanned = false) => {
    target.geometry.computeBoundingBox();
    const size = (target.geometry.boundingBox ?? new Box3()).getSize(new Vector3());
    const hull = new Mesh(target.geometry, materials.outline);
    hull.scale.set(1 + (2 * width) / size.x, spanned ? 1 : 1 + (2 * width) / size.y, 1 + (2 * width) / size.z);
    target.add(hull);
    return target;
  };

  const group = new Group();
  const base = outline(mesh(new RoundedBoxGeometry(BASE.size.x, BASE.size.y, BASE.size.z, 6, BASE.bevel), materials.side), OUTLINE.body);
  base.position.copy(BASE.center);
  const baseTop = BASE.center.y + BASE.size.y / 2;
  const top = outline(mesh(new RoundedBoxGeometry(BASE.size.x + 0.02, TOP.thickness, BASE.size.z + 0.02, 4, TOP.bevel), materials.top), OUTLINE.body);
  top.position.set(BASE.center.x, baseTop + TOP.thickness / 2 - 0.004, BASE.center.z);
  const plinthTop = baseTop + TOP.thickness - 0.004;

  const shadow = mesh(new PlaneGeometry(BASE.size.x, BASE.size.z), materials.shadow);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(BASE.center.x + SHADOW_OFFSET, BASE.center.y - BASE.size.y / 2 - 0.004, BASE.center.z + SHADOW_OFFSET);

  const platter = new Group();
  const platterBody = outline(mesh(new CylinderGeometry(PLATTER.radius, PLATTER.radius * 0.985, PLATTER.height, 128), materials.platter), OUTLINE.body);
  platterBody.position.y = PLATTER.y;
  const record = new Group();
  const vinyl = mesh(new CylinderGeometry(RECORD.radius, RECORD.radius, RECORD.height, 192), [materials.platter, materials.grooved, materials.platter]);
  vinyl.position.y = RECORD.y;
  const label = mesh(new CircleGeometry(RECORD.labelRadius, 96), materials.label);
  label.rotation.x = -Math.PI / 2;
  label.position.y = RECORD.y + RECORD.height / 2 + 0.0008;
  record.add(vinyl, label);
  const spindle = mesh(new CylinderGeometry(SPINDLE.radius, SPINDLE.radius, 1, 24), materials.paper);
  span(spindle, new Vector3(0, SPINDLE.bottom, 0), new Vector3(0, SPINDLE.top, 0));
  const spindleCap = mesh(new SphereGeometry(SPINDLE.radius, 16, 8), materials.paper);
  spindleCap.position.y = SPINDLE.top;
  // The globe floats a few centimetres above the spindle, on a thin rod.
  const rod = mesh(new CylinderGeometry(ROD_RADIUS, ROD_RADIUS, 1, 16), materials.paper);
  span(rod, new Vector3(0, SPINDLE.top, 0), new Vector3(0, -0.995, 0));
  platter.add(platterBody, record, spindle, spindleCap, rod);

  const arm = new Group();
  const armBase = mesh(new CylinderGeometry(0.22, 0.25, 0.08, 48), materials.navy);
  armBase.position.set(PIVOT.x, plinthTop + 0.04, PIVOT.z);
  const post = outline(mesh(new CylinderGeometry(0.045, 0.045, 1, 24), materials.paper), OUTLINE.arm, true);
  span(post, new Vector3(PIVOT.x, plinthTop, PIVOT.z), PIVOT);
  const bearing = mesh(new TorusGeometry(0.085, 0.018, 16, 48), materials.navy);
  bearing.position.copy(PIVOT);
  const bearingRing = mesh(new TorusGeometry(0.12, 0.008, 12, 48), materials.navy);
  bearingRing.position.copy(PIVOT);
  bearingRing.rotation.x = Math.PI / 2;
  const tube = outline(mesh(new CylinderGeometry(ARM_RADIUS, ARM_RADIUS, 1, 24), materials.paper), OUTLINE.arm, true);
  const counterweight = outline(mesh(new CylinderGeometry(0.1, 0.1, 1, 40), materials.paper), OUTLINE.arm, true);
  const headshell = outline(mesh(new RoundedBoxGeometry(0.08, 0.035, 0.13, 3, 0.012), materials.head), OUTLINE.arm);
  const needle = mesh(new ConeGeometry(0.014, NEEDLE_LENGTH, 12), materials.navy);
  const cableTube = mesh(new CylinderGeometry(0.005, 0.005, 1, 8), materials.navy);
  // The cable runs from the pivot down beside the post and into the plinth.
  const cableDrop = mesh(
    new TubeGeometry(
      new CatmullRomCurve3([
        PIVOT.clone().add(new Vector3(0.06, -0.02, 0.05)),
        new Vector3(PIVOT.x + 0.12, PIVOT.y - 0.5, PIVOT.z + 0.1),
        new Vector3(PIVOT.x + 0.1, plinthTop + 0.01, PIVOT.z + 0.26),
      ]),
      32,
      0.006,
      8,
    ),
    materials.navy,
  );
  const armShadow = mesh(new PlaneGeometry(1, ARM_SHADOW.width), materials.armShadow);
  armShadow.rotation.order = "YXZ";
  armShadow.rotation.x = -Math.PI / 2;
  arm.add(armBase, post, bearing, bearingRing, tube, counterweight, headshell, needle, cableTube, cableDrop, armShadow);
  // The arm hides the data layer where it passes in front of the globe.
  asOccluder(arm);

  group.add(shadow, base, top, platter, arm);

  const head = new Vector3();
  const back = new Vector3();
  const inward = new Vector3();
  const side = new Vector3();
  const pointInward = new Quaternion();
  let labelTexture: CanvasTexture | null = null;

  return {
    group,
    platter,
    record,
    arm,
    setArm(tipAt, normal) {
      head.copy(tipAt).addScaledVector(normal, HEADSHELL_OFFSET);
      span(tube, PIVOT, head);
      bearing.lookAt(head);
      back.subVectors(PIVOT, head).normalize();
      span(counterweight, PIVOT.clone().addScaledVector(back, 0.16), PIVOT.clone().addScaledVector(back, 0.36));
      side.crossVectors(back, UP).normalize().multiplyScalar(ARM_RADIUS + 0.008);
      span(cableTube, PIVOT.clone().add(side), head.clone().add(side));
      inward.copy(normal).negate();
      pointInward.setFromUnitVectors(UP, inward);
      headshell.position.copy(head);
      headshell.quaternion.copy(pointInward);
      needle.position.copy(tipAt).addScaledVector(normal, NEEDLE_LENGTH / 2);
      needle.quaternion.copy(pointInward);
      const dx = head.x - PIVOT.x;
      const dz = head.z - PIVOT.z;
      armShadow.position.set((PIVOT.x + head.x) / 2 + ARM_SHADOW.offset, ARM_SHADOW.y, (PIVOT.z + head.z) / 2 + ARM_SHADOW.offset);
      armShadow.scale.x = Math.hypot(dx, dz);
      armShadow.rotation.y = -Math.atan2(dz, dx);
    },
    setArmScale(scale, tipAt) {
      arm.scale.setScalar(scale);
      arm.position.copy(tipAt).multiplyScalar(1 - scale);
    },
    setLabel(canvas) {
      labelTexture?.dispose();
      labelTexture = new CanvasTexture(canvas);
      labelTexture.colorSpace = SRGBColorSpace;
      labelTexture.anisotropy = 8;
      materials.label.map = labelTexture;
      materials.label.needsUpdate = true;
    },
    dispose() {
      for (const g of geometries) g.dispose();
      for (const m of Object.values(materials)) m.dispose();
      gradient.dispose();
      grooves.dispose();
      labelTexture?.dispose();
    },
  };
}
