// A record's rotation at 33⅓ rpm, with the motor's spin-up and spin-down. One
// model for every disc: the CSS discs (use-spin) and the Turntable's platter.

const TURN_SECONDS = 1.8;
const SPIN_UP_SECONDS = 0.4;
const SPIN_DOWN_SECONDS = 0.7;

export interface Spin {
  /** Share of full speed, 0..1. */
  velocity: number;
  /** Radians, growing while it turns. */
  angle: number;
}

export const createSpin = (): Spin => ({ velocity: 0, angle: 0 });

/** Advances `spin` by `dt` seconds towards full speed (playing) or a stop. */
export function stepSpin(spin: Spin, playing: boolean, dt: number): void {
  spin.velocity = playing ? Math.min(1, spin.velocity + dt / SPIN_UP_SECONDS) : Math.max(0, spin.velocity - dt / SPIN_DOWN_SECONDS);
  spin.angle = (spin.angle + (spin.velocity * 2 * Math.PI * dt) / TURN_SECONDS) % (2 * Math.PI);
}
