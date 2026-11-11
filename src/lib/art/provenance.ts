import { repoLink } from "@/lib/provenance/repo";
import type { Provenance, ProvenanceStatus } from "@/lib/provenance/types";

interface ArtFacts {
  subject: string;
  method: string;
  scripts: readonly string[];
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
