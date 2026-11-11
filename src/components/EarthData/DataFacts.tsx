"use client";

import { FLAGS } from "@/lib/flags";
import type { Provenance } from "@/lib/provenance/types";
import { CheckedWith } from "./CheckedWith";
import { LiveCheckFacts } from "./LiveCheckFacts";

const OFFICIAL_ID = /_\d{4,5}$/u;

export function DataFacts({ facts }: { facts: Provenance }) {
  return (
    <>
      {FLAGS.dataLeftovers && facts.liveCheck && <LiveCheckFacts record={facts.liveCheck} />}
      {FLAGS.dataLeftovers && facts.health && OFFICIAL_ID.test(facts.health) && <CheckedWith record={facts.health} />}
    </>
  );
}
