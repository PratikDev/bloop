// The turntable beside the globe, cel-shaded: a flat coral plinth with a navy
// outline and a hard offset shadow, a navy platter and record with drawn
// grooves, a paper label, and a paper-and-navy tonearm with a coral stylus.
// The record is the Earth as grooves: radius is latitude (outer edge 90° N,
// inner edge 90° S), angle is longitude; the arm sits on the latitude's groove.

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

const BASE = { size: new Vector3(3.9, 0.24, 3.8), center: new Vector3(0.2, -1.42, 0.1), bevel: 0.06 };
const TOP = { thickness: 0.05, bevel: 0.022 };
const PLATTER = { radius: 1.6, height: 0.06, y: -1.2 };
const RECORD = { radius: 1.5, height: 0.012, y: -1.164, labelRadius: 0.48 };
const SPINDLE = { radius: 0.03, bottom: -1.16, top: -1.09 };
/** The arm's pivot: back right, a little above the record. */
const PIVOT = new Vector3(1.75, -0.86, -0.95);
/** The pivot to the stylus tip, in plan: it reaches every groove from the label's edge to the rim. */
const ARM_REACH = 2.0;
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
/** The record's surface, its grooves' span (radius for 90° S and 90° N) and where the stylus rests off the record. */
export const RECORD_TOP = RECORD.y + RECORD.height / 2;
export const GROOVES = { inner: RECORD.labelRadius + 0.06, outer: RECORD.radius - 0.05 } as const;
export const ARM_REST = new Vector3(1.9, RECORD_TOP + 0.12, 1.0);

/** The groove's radius for a latitude: outer edge 90° N, inner edge 90° S. */
export const grooveRadius = (lat: number) => GROOVES.inner + ((lat + 90) / 180) * (GROOVES.outer - GROOVES.inner);

/**
 * Where the stylus tip touches the record for a latitude, in the deck's frame: the point on that groove the arm reaches
 * from its pivot (the one on the record's right, nearer the pivot).
 */
export function grooveTip(lat: number): Vector3 {
  const r = grooveRadius(lat);
  const px = PIVOT.x;
  const pz = PIVOT.z;
  const d = Math.hypot(px, pz);
  const a = (r * r - ARM_REACH * ARM_REACH + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, r * r - a * a));
  const bx = (a * px) / d;
  const bz = (a * pz) / d;
  const one = { x: bx - (h * pz) / d, z: bz + (h * px) / d };
  const two = { x: bx + (h * pz) / d, z: bz - (h * px) / d };
  const p = one.x > two.x ? one : two;
  return new Vector3(p.x, RECORD_TOP, p.z);
}

/** The angle on the record at the tip (radians, x = sin, z = cos, as lib/sphere's longitude). */
export const tipAngle = (lat: number) => {
  const t = grooveTip(lat);
  return Math.atan2(t.x, t.z);
};

const UP = new Vector3(0, 1, 0);

export interface Deck {
  group: Group;
  platter: Group;
  /** The record on the platter: turns with the Earth (lifted during a record change). */
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

/** The plinth's top surface and its extent in plan (the deck's hardware sits on it). */
export const PLINTH_TOP = BASE.center.y + BASE.size.y / 2 + TOP.thickness - 0.004;
export const PLINTH = {
  minX: BASE.center.x - BASE.size.x / 2,
  maxX: BASE.center.x + BASE.size.x / 2,
  minZ: BASE.center.z - BASE.size.z / 2,
  maxZ: BASE.center.z + BASE.size.z / 2,
} as const;
/** Inverted-hull outline widths for the deck's body and its small parts, in scene units. */
export const OUTLINE_WIDTH = OUTLINE;

/** The cel-shading kit the deck and its hardware share: the three-step gradient, toon materials, navy outlines. */
export interface ToonKit {
  gradient: DataTexture;
  toon(color: string): MeshToonMaterial;
  mesh(geometry: BufferGeometry, material: Material | Material[]): Mesh;
  /**
   * An inverted hull: a navy, back-faced copy grown by `width` on each side, drawn as a child so it follows the
   * mesh. Spanned meshes are stretched along y every frame, so they only grow around it.
   */
  outline(target: Mesh, width: number, spanned?: boolean): Mesh;
  outlineMaterial: MeshBasicMaterial;
  dispose(): void;
}

export function createToonKit(palette: Palette): ToonKit {
  const geometries: BufferGeometry[] = [];
  const made: Material[] = [];
  const gradient = toonGradient();
  const outlineMaterial = new MeshBasicMaterial({ color: new Color(palette["arm-edge"]), side: BackSide });
  return {
    gradient,
    toon(color) {
      const m = new MeshToonMaterial({ color: new Color(color), gradientMap: gradient });
      made.push(m);
      return m;
    },
    mesh(geometry, material) {
      geometries.push(geometry);
      return new Mesh(geometry, material);
    },
    outline(target, width, spanned = false) {
      target.geometry.computeBoundingBox();
      const size = (target.geometry.boundingBox ?? new Box3()).getSize(new Vector3());
      const hull = new Mesh(target.geometry, outlineMaterial);
      hull.scale.set(1 + (2 * width) / size.x, spanned ? 1 : 1 + (2 * width) / size.y, 1 + (2 * width) / size.z);
      target.add(hull);
      return target;
    },
    outlineMaterial,
    dispose() {
      for (const g of geometries) g.dispose();
      for (const m of made) m.dispose();
      outlineMaterial.dispose();
      gradient.dispose();
    },
  };
}

export function createDeck(palette: Palette): Deck {
  const kit = createToonKit(palette);
  const { gradient, toon, mesh, outline } = kit;
  const grooves = grooveTexture(palette.platter, palette.groove);

  const materials = {
    side: toon(palette["deck-side"]),
    top: toon(palette["deck-top"]),
    platter: toon(palette.platter),
    grooved: new MeshToonMaterial({ map: grooves, gradientMap: gradient }),
    paper: toon(palette.arm),
    navy: toon(palette["arm-edge"]),
    head: toon(palette.stylus),
    label: new MeshToonMaterial({ gradientMap: gradient }),
    shadow: new MeshBasicMaterial({ color: new Color(palette["shadow-on-space"]) }),
    armShadow: new MeshBasicMaterial({ color: new Color(palette["arm-edge"]) }),
  };
  const group = new Group();
  const base = outline(mesh(new RoundedBoxGeometry(BASE.size.x, BASE.size.y, BASE.size.z, 6, BASE.bevel), materials.side), OUTLINE.body);
  base.position.copy(BASE.center);
  const baseTop = BASE.center.y + BASE.size.y / 2;
  const top = outline(mesh(new RoundedBoxGeometry(BASE.size.x + 0.02, TOP.thickness, BASE.size.z + 0.02, 4, TOP.bevel), materials.top), OUTLINE.body);
  top.position.set(BASE.center.x, baseTop + TOP.thickness / 2 - 0.004, BASE.center.z);
  const plinthTop = PLINTH_TOP;

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
  platter.add(platterBody, record, spindle, spindleCap);

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
        new Vector3(PIVOT.x + 0.12, (PIVOT.y + plinthTop) / 2, PIVOT.z + 0.1),
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
      for (const m of Object.values(materials)) m.dispose();
      kit.dispose();
      grooves.dispose();
      labelTexture?.dispose();
    },
  };
}
