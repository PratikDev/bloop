// The turntable around the globe, built in code: base, platter, spindle and a
// tonearm whose needle rests on the globe. Low-poly and flat-shaded, coloured
// from the CSS tokens (chrome colours, which never mean data).

import {
  BoxGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshLambertMaterial,
  Quaternion,
  Vector3,
  type BufferGeometry,
} from "three";
import type { Palette } from "@/lib/css-tokens";

export const GLOBE_RADIUS = 1;

const BASE = { width: 4.4, height: 0.22, depth: 3.6, center: new Vector3(0.35, -1.31, 0.1) };
const PLATTER = { radius: 1.55, height: 0.08, y: -1.16, segments: 24 };
const SPINDLE = { radius: 0.06, bottom: -1.12, top: -0.97 };
const MARKER = { size: new Vector3(0.28, 0.02, 0.1), at: new Vector3(1.3, -1.11, 0) };
const PIVOT = new Vector3(2.05, 0.1, 0.9);
const POST_RADIUS = 0.09;
const ARM_RADIUS = 0.035;
const COUNTERWEIGHT = { radius: 0.12, length: 0.22, behind: 0.3 };
const HEADSHELL = { size: new Vector3(0.12, 0.05, 0.16), offset: 0.14 };
const NEEDLE = { radius: 0.035, length: 0.12 };

const UP = new Vector3(0, 1, 0);

export interface Deck {
  group: Group;
  /** Turns with the globe, so the rotation is visible on the platter too. */
  platter: Group;
  /** Puts the needle tip at `tip` (world space), pointing along −`normal`. */
  setArm(tip: Vector3, normal: Vector3): void;
  dispose(): void;
}

/** Places a unit-height, Y-aligned mesh between two points. */
function span(mesh: Mesh, from: Vector3, to: Vector3) {
  const dir = new Vector3().subVectors(to, from);
  mesh.position.copy(from).addScaledVector(dir, 0.5);
  mesh.scale.set(1, dir.length(), 1);
  mesh.quaternion.setFromUnitVectors(UP, dir.normalize());
}

export function createDeck(palette: Palette): Deck {
  const geometries: BufferGeometry[] = [];
  // Lambert, not Standard: three's PBR materials register on a module-level lookup
  // texture (DFG_LUT) that then keeps every disposed renderer and its GL context alive.
  const material = (token: keyof Palette) => new MeshLambertMaterial({ color: new Color(palette[token]), flatShading: true });
  const materials = {
    base: material("tide"),
    platter: material("line"),
    metal: material("haze"),
    accent: material("shapla"),
    marker: material("moon"),
    weight: material("dusk"),
  };
  const mesh = (geometry: BufferGeometry, mat: MeshLambertMaterial) => {
    geometries.push(geometry);
    return new Mesh(geometry, mat);
  };

  const group = new Group();
  const base = mesh(new BoxGeometry(BASE.width, BASE.height, BASE.depth), materials.base);
  base.position.copy(BASE.center);

  const platter = new Group();
  const disc = mesh(new CylinderGeometry(PLATTER.radius, PLATTER.radius, PLATTER.height, PLATTER.segments), materials.platter);
  disc.position.y = PLATTER.y;
  const marker = mesh(new BoxGeometry(MARKER.size.x, MARKER.size.y, MARKER.size.z), materials.marker);
  marker.position.copy(MARKER.at);
  const spindle = mesh(new CylinderGeometry(SPINDLE.radius, SPINDLE.radius, 1, 8), materials.metal);
  span(spindle, new Vector3(0, SPINDLE.bottom, 0), new Vector3(0, SPINDLE.top, 0));
  platter.add(disc, marker, spindle);

  const post = mesh(new CylinderGeometry(POST_RADIUS, POST_RADIUS, 1, 8), materials.metal);
  span(post, new Vector3(PIVOT.x, BASE.center.y + BASE.height / 2, PIVOT.z), PIVOT);
  const arm = mesh(new CylinderGeometry(ARM_RADIUS, ARM_RADIUS, 1, 6), materials.metal);
  const counterweight = mesh(new CylinderGeometry(COUNTERWEIGHT.radius, COUNTERWEIGHT.radius, 1, 8), materials.weight);
  const headshell = mesh(new BoxGeometry(HEADSHELL.size.x, HEADSHELL.size.y, HEADSHELL.size.z), materials.metal);
  const needle = mesh(new ConeGeometry(NEEDLE.radius, NEEDLE.length, 8), materials.accent);

  group.add(base, platter, post, arm, counterweight, headshell, needle);

  const head = new Vector3();
  const back = new Vector3();
  const inward = new Vector3();
  const pointInward = new Quaternion();

  return {
    group,
    platter,
    setArm(tip, normal) {
      head.copy(tip).addScaledVector(normal, HEADSHELL.offset);
      span(arm, PIVOT, head);
      // The counterweight sits on the arm's line, behind the pivot.
      back.subVectors(PIVOT, head).normalize();
      span(counterweight, PIVOT.clone().addScaledVector(back, COUNTERWEIGHT.behind - COUNTERWEIGHT.length / 2), PIVOT.clone().addScaledVector(back, COUNTERWEIGHT.behind + COUNTERWEIGHT.length / 2));
      inward.copy(normal).negate();
      pointInward.setFromUnitVectors(UP, inward);
      headshell.position.copy(head);
      headshell.quaternion.copy(pointInward);
      // A cone's apex is +Y; centring it half a length out puts the apex on the tip.
      needle.position.copy(tip).addScaledVector(normal, NEEDLE.length / 2);
      needle.quaternion.copy(pointInward);
    },
    dispose() {
      for (const g of geometries) g.dispose();
      for (const m of Object.values(materials)) m.dispose();
    },
  };
}
