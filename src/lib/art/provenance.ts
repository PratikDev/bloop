// "How we got this" for ART's numbers (the data-voice check, Earth Orchestra's counts, the raw-pixel measurements, the
// letter, Your lifetime): one builder, so every card says where its number came from in the same shape. A field the
// number doesn't have stays null ("not available" on screen), never a guess.

import { repoLink } from "@/lib/provenance/repo";
import type { Provenance, ProvenanceStatus } from "@/lib/provenance/types";

interface ArtFacts {
  subject: string;
  method: string;
  scripts: readonly string[];
  /** The test that checks the number. */
  test: string;
  dataset?: string | null;
  link?: string | null;
  window?: string | null;
  place?: string | null;
  uncertainty?: string | null;
  n?: string | null;
  status?: ProvenanceStatus | null;
}

export function artProvenance(f: ArtFacts): Provenance {
  return {
    subject: f.subject,
    dataset: f.dataset ?? null,
    version: null,
    link: f.link ?? null,
    window: f.window ?? null,
    cell: null,
    place: f.place ?? null,
    method: f.method,
    uncertainty: f.uncertainty ?? null,
    n: f.n ?? null,
    status: f.status ?? null,
    scripts: f.scripts.map((s) => repoLink(s)),
    validation: repoLink(f.test),
    patternOnly: null,
  };
}
