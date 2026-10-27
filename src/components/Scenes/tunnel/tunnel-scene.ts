// The Dhaka time tunnel, in three.js: one ring per year down the −z axis, its
// colour the April–May anomaly on the diverging scale (overlay pass: the
// colour is never shifted), twelve beads per ring sized by GPCP rain (area ∝
// mm/day; no bead where GPCP has no month), the two demo windows drawn
// heavier, and a warm glow on every June bead (decoration: the monsoon's start).

import {
  AdditiveBlending,
  Color,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  SphereGeometry,
  TorusGeometry,
  Vector3,
  type PerspectiveCamera,
} from "three";
import type { TunnelYear } from "@/lib/audio-adapter/types";
import type { Palette } from "@/lib/css-tokens";
import { onOverlay } from "../../Turntable/scene/layers";
import { createStudio } from "../../Turntable/scene/studio";
import { sampleScale, type Rgb } from "../colormaps";

export const RING_GAP = 1.4;
const RING_RADIUS = 2.2;
const RING_TUBE = 0.035;
const WINDOW_TUBE = 0.075;
/** Bead radius: area ∝ mm/day (radius ∝ √mm/day). Stated on screen. */
export const BEAD_RADIUS_PER_SQRT_MM = 0.028;
const JUNE = 5;
const CAMERA_BEHIND = 9.5;
const CAMERA_LIFT = 0.35;
const LOOK_AHEAD = 6;

export interface TunnelFrame {
  width: number;
  height: number;
  needle: { x: number; y: number };
  blend: number;
  anchor(key: string): { x: number; y: number } | null;
}

export interface TunnelScene {
  group: Group;
  /** Camera at a (fractional) year index. */
  setPosition(index: number, camera: PerspectiveCamera): void;
  frame(index: number, camera: PerspectiveCamera, width: number, height: number): TunnelFrame;
  setStars(on: boolean): void;
  dispose(): void;
}

const ringZ = (i: number) => -i * RING_GAP;
const toLinear = ([r, g, b]: Rgb) => new Color().setRGB(r / 255, g / 255, b / 255).convertSRGBToLinear();

export function createTunnelScene(o: {
  rows: readonly TunnelYear[];
  windows: { key: string; from: number; to: number }[];
  scale: { clamp: number; colours: readonly Rgb[] };
  palette: Palette;
}): TunnelScene {
  const { rows } = o;
  const group = new Group();
  const studio = createStudio(o.palette);
  studio.setStars(1);
  group.add(studio.group);
  const inWindow = (year: number) => o.windows.some((w) => year >= w.from && year <= w.to);

  const ringGeometry = new TorusGeometry(RING_RADIUS, RING_TUBE, 10, 120);
  const windowGeometry = new TorusGeometry(RING_RADIUS, WINDOW_TUBE, 12, 120);
  const rings = rows.map((row, i) => {
    const colour = row.heat === null ? new Color(o.palette.line) : toLinear(sampleScale(o.scale.colours, row.heat / o.scale.clamp / 2 + 0.5));
    const ring = new Mesh(inWindow(row.year) ? windowGeometry : ringGeometry, new MeshBasicMaterial({ color: colour, transparent: row.heat === null, opacity: row.heat === null ? 0.3 : 1 }));
    ring.position.z = ringZ(i);
    onOverlay(ring);
    group.add(ring);
    return ring;
  });

  // Beads: January at the top, clockwise like a clock face (a design choice).
  const beads = rows.flatMap((row, i) =>
    row.months.flatMap((mm, m) => (mm === null || mm <= 0 ? [] : [{ i, m, r: BEAD_RADIUS_PER_SQRT_MM * Math.sqrt(mm) }])),
  );
  const beadMesh = new InstancedMesh(new SphereGeometry(1, 14, 10), new MeshBasicMaterial({ color: new Color(o.palette.label) }), Math.max(1, beads.length));
  const juneGlow = new InstancedMesh(new SphereGeometry(1, 14, 10), new MeshBasicMaterial({ color: new Color(o.palette.amber).multiplyScalar(2.2), transparent: true, opacity: 0.28, blending: AdditiveBlending, depthWrite: false }), Math.max(1, rows.length));
  const at = (i: number, month: number) => {
    const a = Math.PI / 2 - (month / 12) * Math.PI * 2;
    return new Vector3(Math.cos(a) * RING_RADIUS, Math.sin(a) * RING_RADIUS, ringZ(i));
  };
  beads.forEach((b, k) => beadMesh.setMatrixAt(k, new Matrix4().makeScale(b.r, b.r, b.r).setPosition(at(b.i, b.m))));
  beadMesh.count = beads.length;
  onOverlay(beadMesh);
  rows.forEach((_, i) => juneGlow.setMatrixAt(i, new Matrix4().makeScale(0.1, 0.1, 0.1).setPosition(at(i, JUNE))));
  group.add(beadMesh, juneGlow);

  const anchors = new Map(o.windows.map((w) => [w.key, new Vector3(0, RING_RADIUS + 0.45, ringZ(rows.findIndex((r) => r.year === w.from)))]));
  const p = new Vector3();
  const screen = (v: Vector3, camera: PerspectiveCamera, width: number, height: number) => {
    p.copy(v).project(camera);
    return p.z > 1 || p.z < -1 ? null : { x: ((p.x + 1) / 2) * width, y: ((1 - p.y) / 2) * height };
  };

  return {
    group,
    setPosition(index, camera) {
      const z = ringZ(index);
      camera.position.set(0, CAMERA_LIFT, z + CAMERA_BEHIND);
      camera.lookAt(0, 0, z - LOOK_AHEAD);
    },
    frame(index, camera, width, height) {
      const i = Math.round(index);
      const needle = screen(new Vector3(0, RING_RADIUS, ringZ(i)), camera, width, height) ?? { x: width / 2, y: height / 3 };
      return {
        width,
        height,
        needle,
        blend: 1,
        anchor: (key) => {
          const v = anchors.get(key);
          return v ? screen(v, camera, width, height) : null;
        },
      };
    },
    setStars(on) {
      studio.setStars(on ? 1 : 0);
    },
    dispose() {
      ringGeometry.dispose();
      windowGeometry.dispose();
      for (const r of rings) (r.material as MeshBasicMaterial).dispose();
      beadMesh.geometry.dispose();
      (beadMesh.material as MeshBasicMaterial).dispose();
      beadMesh.dispose();
      juneGlow.geometry.dispose();
      (juneGlow.material as MeshBasicMaterial).dispose();
      juneGlow.dispose();
      studio.dispose();
    },
  };
}
