// Rain from the IMERG sequence as falling streaks: each wet cell in the region
// spawns streaks at the rain voice's own density (mapping.json "rain"/"snow",
// drops per second), so what you see falls at the rate you hear. Decoration on
// top of the data; off with reduced motion.

import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, LineBasicMaterial, LineSegments } from "three";
import { mapVoice } from "@/lib/audio/mapping";
import { decodeSequenceCode, type Sequence, type SequenceFrame } from "@/lib/data";
import type { GeoPlane } from "./plane";

const FALL_UNITS_PER_SEC = 7;
const STREAK = 0.09;

export interface RainCell {
  x: number;
  z: number;
  /** Streaks per second (the rule's drops per second). */
  rate: number;
  frozen: boolean;
}

/** The wet cells of a sequence frame inside the plane's bounds, with their rule rates. */
export function rainCells(seq: Sequence, frame: SequenceFrame, plane: GeoPlane): RainCell[] {
  const { width, height } = seq.size;
  const [w, s, e, n] = plane.bounds;
  const cells: RainCell[] = [];
  for (let row = Math.floor(((90 - n) / 180) * height); row <= Math.ceil(((90 - s) / 180) * height); row++) {
    if (row < 0 || row >= height) continue;
    const lat = 90 - ((row + 0.5) / height) * 180;
    for (let col = Math.floor(((w + 180) / 360) * width); col <= Math.ceil(((e + 180) / 360) * width); col++) {
      if (col < 0 || col >= width) continue;
      const lon = -180 + ((col + 0.5) / width) * 360;
      if (!plane.contains(lat, lon)) continue;
      const v = decodeSequenceCode(frame.codes[row * width + col]);
      if (v.mmPerHour === null || v.mmPerHour <= 0) continue;
      const frozen = v.phase === "frozen";
      const rate = mapVoice(frozen ? "snow" : "rain", v.mmPerHour) ?? 0;
      if (rate <= 0) continue;
      cells.push({ ...plane.toXZ(lat, lon), rate, frozen });
    }
  }
  return cells;
}

export interface RainParticles {
  object: LineSegments;
  setCells(cells: RainCell[], cellSize: number): void;
  update(dt: number, enabled: boolean): void;
  dispose(): void;
}

export function createRainParticles(o: { max: number; top: number; groundAt(x: number, z: number): number; colour: string }): RainParticles {
  const positions = new Float32Array(o.max * 6);
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setDrawRange(0, 0);
  const material = new LineBasicMaterial({ color: new Color(o.colour), transparent: true, opacity: 0.12, blending: AdditiveBlending, depthWrite: false });
  const object = new LineSegments(geometry, material);
  object.frustumCulled = false;
  // Per particle: x, y, z, ground.
  const state = new Float32Array(o.max * 4);
  let count = 0;
  let cells: RainCell[] = [];
  let size = 0.3;
  let owed: Float32Array = new Float32Array(0);

  return {
    object,
    setCells(next, cellSize) {
      cells = next;
      size = cellSize;
      owed = new Float32Array(next.length);
    },
    update(dt, enabled) {
      object.visible = enabled;
      if (!enabled) {
        count = 0;
        return;
      }
      // Spawn: each cell owes rate × dt streaks.
      for (let c = 0; c < cells.length; c++) {
        owed[c] += cells[c].rate * dt;
        while (owed[c] >= 1 && count < o.max) {
          owed[c] -= 1;
          const x = cells[c].x + (Math.random() - 0.5) * size;
          const z = cells[c].z + (Math.random() - 0.5) * size;
          state.set([x, o.top - Math.random() * 0.4, z, o.groundAt(x, z)], count * 4);
          count++;
        }
        if (count >= o.max) owed[c] = 0;
      }
      // Fall; a streak that reaches the ground is replaced by the last one.
      for (let i = count - 1; i >= 0; i--) {
        state[i * 4 + 1] -= FALL_UNITS_PER_SEC * dt;
        if (state[i * 4 + 1] > state[i * 4 + 3]) continue;
        count--;
        state.copyWithin(i * 4, count * 4, count * 4 + 4);
      }
      for (let i = 0; i < count; i++) {
        const [x, y, z] = [state[i * 4], state[i * 4 + 1], state[i * 4 + 2]];
        positions.set([x, y, z, x, y + STREAK, z], i * 6);
      }
      geometry.setDrawRange(0, count * 2);
      (geometry.getAttribute("position") as BufferAttribute).needsUpdate = true;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}
