import type { ChordBlock, ChordGate, ChordRequest, ValueTrust } from "../types";
import type { ChordAllowance } from "./allowlist";

interface GateInput {
  req: ChordRequest;
  trust: ValueTrust;
  allowance: ChordAllowance;
  pitched: boolean;
  hasValues: boolean;
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
