"use client";

import { FLAGS } from "@/lib/flags";
import type { Provenance } from "@/lib/provenance/types";
import { FreshFacts } from "./FreshFacts";
import { LiveCheckFacts } from "./LiveCheckFacts";

/** The DATA additions to a How we got this panel: "Is this data fresh?" and, for a live frame, its acceptance check. */
export function DataFacts({ facts }: { facts: Provenance }) {
  return (
    <>
      {FLAGS.dataLeftovers && facts.liveCheck && <LiveCheckFacts record={facts.liveCheck} />}
      {FLAGS.dataHealth && facts.health && <FreshFacts id={facts.health} />}
    </>
  );
}
