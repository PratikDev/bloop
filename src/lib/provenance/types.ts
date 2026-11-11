import type { OfficialStatus } from "@/types/data-contract";
import type { LiveCheckRecord } from "./live-checks";

export type ProvenanceStatus = OfficialStatus | "file";

export interface ProvenanceLink {
  label: string;
  href: string;
}

export interface Provenance {
  subject: string;
  dataset: string | null;
  version: string | null;
  link: string | null;
  window: string | null;
  cell: string | null;
  place: string | null;
  method: string | null;
  uncertainty: string | null;
  n: string | null;
  status: ProvenanceStatus | null;
  scripts: ProvenanceLink[];
  validation: ProvenanceLink | null;
  patternOnly: string | null;
  health?: string;
  liveCheck?: LiveCheckRecord;
}
