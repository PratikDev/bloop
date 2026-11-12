"use client";

import type { PlaceSeries } from "@/lib/history";
import { formatList } from "@/lib/i18n";
import { useAppState, useT } from "../AppState/use-app-state";

/**
 * Where the record comes from and how far to trust it, with L1's rules
 * (contract §4, §14): same cell = same record, nearest land cell, rain
 * confidence, and "computed" outside Bangladesh with the global disclosure.
 */
export function RecordNotes({ series, place, name, world }: { series: PlaceSeries; place: string; name: (place: string) => string; world: { disclosure: string } | null }) {
  const t = useT();
  const { state } = useAppState();
  const { source, sameRecord, caveat, confidence } = series;
  return (
    <div className="space-y-1 text-small text-haze">
      <p>
        {source.kind === "cell"
          ? `${t("history.cell", { lat: source.lat, lon: source.lon })}${source.neighbour ? ` ${t("history.neighbour")}` : ""}`
          : source.label === null
            ? t("history.nationalBox")
            : t("data.text", { text: source.label })}
      </p>
      {/* The national box already says it's one record for every city; other shared cells or regions are named. */}
      {sameRecord.length > 0 && !(source.kind === "region" && source.label === null) && (
        <p className="text-moon">
          {source.kind === "cell"
            ? t("history.sharedCell", { places: formatList([place, ...sameRecord].map(name), state.lang) })
            : t("history.sharedRegion", { places: sameRecord.map(name).join(", ") })}
        </p>
      )}
      {confidence && <p>{t(`history.confidence.${confidence}`)}</p>}
      {caveat && <p>{t("data.text", { text: caveat })}</p>}
      {world && (
        <>
          <p className="text-moon">{t("history.computed")}</p>
          <p>{world.disclosure}</p>
        </>
      )}
      <p>{series.dataset}</p>
    </div>
  );
}
