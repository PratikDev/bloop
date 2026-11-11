// A radial sweep traversal (the method of SVS 13786, Caldwell 73): a line turns about a centre at a fixed angular speed;
// each point is heard when the line reaches it, and its distance from the centre sets its pitch (the "radar" rule), or
// a ring grows outward and the distance sets the time instead. Pure: points in, timed events out; the caller plays them.

export interface SweepPoint {
  x: number;
  y: number;
}

export interface SweepRule {
  centre: SweepPoint;
  /** Signed: positive turns from +x towards +y (screen coordinates: clockwise on screen). */
  degPerSec: number;
  startDeg: number;
  /** Distance treated as radius 1 (points farther out are clamped). */
  maxRadius: number;
  /** "pitch": the angle sets the time and the radius the pitch; "time": a ring grows outward over durationSec. */
  radiusTo: "pitch" | "time";
  pitch: { minHz: number; maxHz: number; scale: "exponential" | "linear" };
  /** Ring rule only: seconds for the ring to reach maxRadius. */
  durationSec?: number;
}

export interface SweepEvent {
  index: number; // the point's index in the input
  timeSec: number;
  angleDeg: number; // 0–360, from +x towards +y
  radiusFrac: number; // 0–1
  frequencyHz: number | null; // null on the ring rule (radius sets time, not pitch)
}

const FULL_TURN = 360;

function angleOf(p: SweepPoint, c: SweepPoint): number {
  const a = (Math.atan2(p.y - c.y, p.x - c.x) * 180) / Math.PI;
  return (a + FULL_TURN) % FULL_TURN;
}

/** Pitch for a radius fraction: exponential (equal ratios per equal distance) or linear in Hz. */
export function sweepPitch(radiusFrac: number, pitch: SweepRule["pitch"]): number {
  const r = Math.min(1, Math.max(0, radiusFrac));
  return pitch.scale === "exponential" ? pitch.minHz * (pitch.maxHz / pitch.minHz) ** r : pitch.minHz + (pitch.maxHz - pitch.minHz) * r;
}

/** Every point as one event, sorted by time (one turn, or one ring growth). */
export function radialSweep(points: readonly SweepPoint[], rule: SweepRule): SweepEvent[] {
  if (rule.radiusTo === "pitch" && rule.degPerSec === 0) throw new Error("radialSweep: degPerSec must not be 0 on the pitch rule");
  if (rule.radiusTo === "time" && !(rule.durationSec && rule.durationSec > 0)) throw new Error("radialSweep: the ring rule needs durationSec > 0");
  const events = points.map((p, index) => {
    const angleDeg = angleOf(p, rule.centre);
    const radiusFrac = Math.min(1, Math.hypot(p.x - rule.centre.x, p.y - rule.centre.y) / rule.maxRadius);
    if (rule.radiusTo === "time") return { index, timeSec: radiusFrac * (rule.durationSec ?? 0), angleDeg, radiusFrac, frequencyHz: null };
    const travel = rule.degPerSec > 0 ? angleDeg - rule.startDeg : rule.startDeg - angleDeg;
    const timeSec = (((travel % FULL_TURN) + FULL_TURN) % FULL_TURN) / Math.abs(rule.degPerSec);
    return { index, timeSec, angleDeg, radiusFrac, frequencyHz: sweepPitch(radiusFrac, rule.pitch) };
  });
  return events.sort((a, b) => a.timeSec - b.timeSec || a.index - b.index);
}
