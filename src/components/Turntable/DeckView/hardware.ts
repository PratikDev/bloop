// The deck's hardware, on the plinth around the platter: a start/stop button (turns the Earth), a 33/45 switch (the
// turning speed), a cue lever (up = needle lifted = sound paused) and a volume knob (the voices' volume), plus a
// speaker grille. Each piece only mirrors a labelled DOM control (the player bar, More, the Mixer): it shows the same
// state and does the same thing. Pieces move to a new state in HARDWARE_MS (at once under reduced motion).

import { BoxGeometry, CylinderGeometry, Group, type Object3D } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { Palette } from "@/lib/css-tokens";
import { OUTLINE_WIDTH, PLINTH, PLINTH_TOP, type ToonKit } from "../scene/deck";

export type HardwareId = "start" | "speed" | "cue" | "volume";

/** What the hardware shows: the same state as its DOM controls. */
export interface HardwareState {
  /** The Earth is turning (the bar's Turn / Stop turning key). */
  rotating: boolean;
  /** The faster of the two speeds the switch knows (45; 33 is the slower). */
  fast: boolean;
  /** Sound paused: the cue lever is up (the player's Play / Pause key). */
  paused: boolean;
  /** The voices' volume, 0..1 (the Mixer). */
  volume: number;
}

/** How long a piece takes to move to a new state (the motion rules: 120–200 ms). */
export const HARDWARE_MS = 160;
const SWITCH_DEG = 24;
const LEVER_UP_DEG = 38;
const LEVER_DOWN_DEG = 4;
const KNOB_SWEEP_DEG = 270;
const BUTTON_TRAVEL = 0.022;
const RAD = Math.PI / 180;

export interface Hardware {
  group: Group;
  /** The piece a ray hit, or null (the hit object or any of its parents carries the piece's id). */
  idOf(object: Object3D): HardwareId | null;
  /** The meshes a pointer can hit. */
  targets: Object3D[];
  /** The piece's own group (for its size on screen). */
  piece(id: HardwareId): Group;
  setState(state: HardwareState): void;
  /** Moves every piece towards its state by `dt` seconds (at once when `instant`). */
  step(dt: number, instant: boolean): void;
  /** The grille's pulse, 1..1.04. */
  setGrille(scale: number): void;
  /** Debug: where each piece is now (0..1: pressed, 45, lever up, volume) and the grille's scale. */
  shown(): { start: number; speed: number; cue: number; volume: number; grille: number };
}

/** Plinth spots for each piece (plan x, z): the front strip and the right edge, clear of the platter and the arm. */
const SPOT = {
  start: { x: PLINTH.minX + 0.4, z: PLINTH.maxZ - 0.3 },
  speed: { x: PLINTH.minX + 0.95, z: PLINTH.maxZ - 0.25 },
  grille: { x: 0.55, z: PLINTH.maxZ - 0.22 },
  volume: { x: PLINTH.maxX - 0.4, z: PLINTH.maxZ - 0.4 },
  cue: { x: PLINTH.maxX - 0.2, z: 0.25 },
} as const;

export function createHardware(kit: ToonKit, palette: Palette): Hardware {
  const navy = kit.toon(palette["arm-edge"]);
  const paper = kit.toon(palette.arm);
  const coral = kit.toon(palette.stylus);
  const thin = OUTLINE_WIDTH.arm;
  const group = new Group();
  const pieces = {} as Record<HardwareId, Group>;
  const targets: Object3D[] = [];
  const place = (id: HardwareId | "grille", g: Group) => {
    const spot = SPOT[id];
    g.position.set(spot.x, PLINTH_TOP, spot.z);
    group.add(g);
    if (id !== "grille") {
      g.userData.hardware = id;
      pieces[id] = g;
      targets.push(g);
    }
    return g;
  };

  // Start/stop: a latching button, pressed in while the Earth turns.
  const start = place("start", new Group());
  const startBase = kit.outline(kit.mesh(new CylinderGeometry(0.17, 0.18, 0.05, 40), navy), thin);
  startBase.position.y = 0.025;
  const startCap = kit.outline(kit.mesh(new CylinderGeometry(0.12, 0.12, 0.06, 40), coral), thin);
  startCap.position.y = 0.08;
  start.add(startBase, startCap);

  // 33/45: a toggle on a small plate, leaning left at 33 and right at 45.
  const speed = place("speed", new Group());
  const speedPlate = kit.outline(kit.mesh(new RoundedBoxGeometry(0.36, 0.035, 0.18, 2, 0.012), navy), thin);
  speedPlate.position.y = 0.018;
  const speedPivot = new Group();
  speedPivot.position.y = 0.035;
  const speedToggle = kit.outline(kit.mesh(new BoxGeometry(0.05, 0.16, 0.05), paper), thin);
  speedToggle.position.y = 0.08;
  speedPivot.add(speedToggle);
  speed.add(speedPlate, speedPivot);

  // The grille: a navy plate with paper slots; it pulses with the sound's low band.
  const grille = place("grille", new Group());
  const grillePlate = kit.outline(kit.mesh(new RoundedBoxGeometry(0.62, 0.025, 0.24, 2, 0.01), navy), thin);
  grillePlate.position.y = 0.013;
  grille.add(grillePlate);
  for (let i = 0; i < 6; i++) {
    const slot = kit.mesh(new BoxGeometry(0.06, 0.006, 0.17), paper);
    slot.position.set(-0.24 + i * 0.096, 0.028, 0);
    grille.add(slot);
  }

  // Volume: a paper knob with a navy pointer; its turn is the volume.
  const volume = place("volume", new Group());
  const knob = new Group();
  const knobBody = kit.outline(kit.mesh(new CylinderGeometry(0.14, 0.155, 0.09, 40), paper), thin);
  knobBody.position.y = 0.045;
  const knobPointer = kit.mesh(new BoxGeometry(0.025, 0.012, 0.09), navy);
  knobPointer.position.set(0, 0.096, 0.07);
  knob.add(knobBody, knobPointer);
  volume.add(knob);

  // Cue: a lever hinged at the back, its tip raised when the needle is lifted (sound paused).
  const cue = place("cue", new Group());
  const cueBase = kit.outline(kit.mesh(new RoundedBoxGeometry(0.14, 0.05, 0.1, 2, 0.012), navy), thin);
  cueBase.position.set(0, 0.025, -0.08);
  const cueHinge = new Group();
  cueHinge.position.set(0, 0.05, -0.08);
  const cueArm = kit.outline(kit.mesh(new BoxGeometry(0.05, 0.04, 0.3), paper), thin);
  cueArm.position.z = 0.15;
  const cueTip = kit.mesh(new CylinderGeometry(0.035, 0.035, 0.05, 20), coral);
  cueTip.position.set(0, 0.03, 0.29);
  cueHinge.add(cueArm, cueTip);
  cue.add(cueBase, cueHinge);

  const goal = { start: 0, speed: 0, cue: 0, volume: 1 };
  const now = { ...goal };
  const apply = () => {
    startCap.position.y = 0.08 - now.start * BUTTON_TRAVEL;
    speedPivot.rotation.z = (SWITCH_DEG - 2 * SWITCH_DEG * now.speed) * RAD;
    cueHinge.rotation.x = -(LEVER_DOWN_DEG + (LEVER_UP_DEG - LEVER_DOWN_DEG) * now.cue) * RAD;
    knob.rotation.y = (KNOB_SWEEP_DEG / 2 - KNOB_SWEEP_DEG * now.volume) * RAD;
  };
  apply();

  return {
    group,
    targets,
    piece: (id) => pieces[id],
    idOf(object) {
      for (let o: Object3D | null = object; o; o = o.parent) {
        const id = o.userData.hardware as HardwareId | undefined;
        if (id) return id;
      }
      return null;
    },
    setState(s) {
      goal.start = s.rotating ? 1 : 0;
      goal.speed = s.fast ? 1 : 0;
      goal.cue = s.paused ? 1 : 0;
      goal.volume = Math.min(1, Math.max(0, s.volume));
    },
    step(dt, instant) {
      const reach = instant ? Infinity : dt / (HARDWARE_MS / 1000);
      for (const k of ["start", "speed", "cue", "volume"] as const) {
        const d = goal[k] - now[k];
        now[k] += Math.sign(d) * Math.min(Math.abs(d), reach);
      }
      apply();
    },
    setGrille(scale) {
      grille.scale.set(scale, 1, scale);
    },
    shown: () => ({ ...now, grille: grille.scale.x }),
  };
}
