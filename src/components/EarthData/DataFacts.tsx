"use client";

import { FLAGS } from "@/lib/flags";
import type { Provenance } from "@/lib/provenance/types";
import { CheckedWith } from "./CheckedWith";
import { LiveCheckFacts } from "./LiveCheckFacts";

/** An Official or Related record id ends with its SVS id (e.g. ocean2_5425): it has a validation.json. */
const OFFICIAL_ID = /_\d{4,5}$/u;

/** The DATA additions to a How we got this panel: "Is this data fresh?" and, for a live frame, its acceptance check. */
export function DataFacts({ facts }: { facts: Provenance }) {
  return (
    <>
      {FLAGS.dataLeftovers && facts.liveCheck && <LiveCheckFacts record={facts.liveCheck} />}
      {FLAGS.dataLeftovers && facts.health && OFFICIAL_ID.test(facts.health) && <CheckedWith record={facts.health} />}
    </>
  );
}
