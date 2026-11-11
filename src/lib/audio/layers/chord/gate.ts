// PURE: the chord's honesty gate. The chord sounds only where the values it plays can be
// trusted as values and drawn from a colour bar the allowlist accepts, and only as the second data voice.
import type { ChordBlock, ChordGate, ChordRequest, ValueTrust } from "../types";
import type { ChordAllowance } from "./allowlist";

/** What the gate needs to know about the current view of a record. */
interface GateInput {
  req: ChordRequest;
  trust: ValueTrust;
  allowance: ChordAllowance;
  /** The record has a pitch rule and a measured error (the smoothing σ). */
  pitched: boolean;
  /** The box has valid cells. */
  hasValues: boolean;
  /** An owner (the listener's toggle or the dial) holds the chord. */
  held: boolean;
}

export function chordGate(g: GateInput): ChordGate {
  const block: ChordBlock | null =
    g.req.playMode === "both"
      ? "both"
      : g.req.playMode === "duet"
        ? "duet"
        : g.trust === "pattern"
          ? "pattern-only"
          : g.allowance === "none" || !g.pitched
            ? "not-allowlisted"
            : !g.hasValues
              ? "no-data"
              : !g.held
                ? "off"
                : null;
  return { allowed: block === null, block, modesOnly: g.allowance === "modes-only", trust: g.trust };
}
