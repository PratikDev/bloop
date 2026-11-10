"use client";

import { useMemo, type ReactNode } from "react";
import { useFreshness } from "@/hooks/use-freshness";
import { officialProvenance } from "@/lib/provenance/official";
import { useAppState, useT } from "../AppState/use-app-state";
import type { OfficialRecordState } from "../OfficialRecords/use-official-record";
import { JukeboxRead } from ".";
import { useOfficialSource } from "./use-official-source";

/** The panel on an official record: what the jukebox read from the step on screen, around the needle or in a named box. */
export function OfficialRead({ rec, className, children }: { rec: OfficialRecordState; className?: string; children?: ReactNode }) {
  const t = useT();
  const { state } = useAppState();
  const freshness = useFreshness();
  const source = useOfficialSource(rec);
  const base = useMemo(
    () => (rec.manifest && source ? officialProvenance({ t, lang: state.lang, freshness, place: null }, rec.manifest, rec.grids[rec.option?.channels[0]?.layers[0] ?? ""].layer, rec.validation) : null),
    [t, state.lang, freshness, rec.manifest, rec.validation, rec.grids, rec.option, source],
  );
  return (
    <JukeboxRead source={source} base={base} needle={rec.needle} loading={!rec.ready} className={className}>
      {children}
    </JukeboxRead>
  );
}
