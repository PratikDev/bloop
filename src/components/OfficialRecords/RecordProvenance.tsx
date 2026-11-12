"use client";

import { useMemo } from "react";
import { useFreshness } from "@/hooks/use-freshness";
import { officialProvenance } from "@/lib/provenance/official";
import type { OfficialManifest, OfficialPlayOption, OfficialValidationFile } from "@/types/data-contract";
import { useAppState, useT } from "../AppState/use-app-state";
import { HowWeGotThis } from "../HowWeGotThis";

/** "How we got this" for the record on screen: one section per layer the map shows or the voices play. */
export function RecordProvenance({
  manifest,
  validation,
  option,
  place,
}: {
  manifest: OfficialManifest;
  validation: OfficialValidationFile | null;
  option: OfficialPlayOption;
  place: string;
}) {
  const t = useT();
  const { state } = useAppState();
  const freshness = useFreshness();
  const facts = useMemo(() => {
    const ids = [...new Set([option.map, ...option.channels.flatMap((c) => c.layers)])];
    const layers = ids.map((id) => manifest.layers.find((l) => l.id === id)).filter((l) => l !== undefined);
    return layers.map((layer) => {
      const p = officialProvenance({ t, lang: state.lang, freshness, place }, manifest, layer, validation);
      return layers.length > 1 ? { ...p, subject: `${p.subject}: ${t("data.text", { text: layer.label })}` } : p;
    });
  }, [manifest, validation, option, place, t, state.lang, freshness]);
  return <HowWeGotThis facts={facts} className="self-start" />;
}
