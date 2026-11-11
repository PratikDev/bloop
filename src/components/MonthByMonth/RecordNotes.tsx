"use client";

import type { BoundT } from "@/lib/i18n";
import type { PlaceSeries } from "@/lib/history";
import type { GraceContextFile } from "@/types/data-contract";
import { useT } from "../AppState/use-app-state";
import { WaterNote } from "../WaterNote";

/** The same-record line for a place, or null: the shared cell or region named, in one language. */
export function sameRecordLine(t: BoundT, series: PlaceSeries, name: (place: string) => string, deg: number | null): string | null {
  const { source, sameRecord } = series;
  if (source.kind === "region" && source.label === null) return t("water.bangladeshWide", { deg });
  if (!sameRecord.length) return null;
  return t(source.kind === "cell" ? "history.sharedCell" : "history.sharedRegion", { places: sameRecord.map(name).join(", ") });
}

/**
 * Above the chart, so it is on screen without scrolling: the national water note (Bangladesh box),
 * or the places that share this cell or region.
 */
export function SameRecordNote({ series, name, grace }: { series: PlaceSeries; name: (place: string) => string; grace: GraceContextFile }) {
  const t = useT();
  if (series.source.kind === "region" && series.source.label === null) return <WaterNote grace={grace} />;
  const line = sameRecordLine(t, series, name, grace.mascon_deg);
  return line ? (
    <p data-testid="shared-cell-note" className="text-small text-moon">
      {line}
    </p>
  ) : null;
}

/**
 * Where the record comes from and how far to trust it, with L1's rules
 * (contract §4, §14): same cell = same record, nearest land cell, rain
 * confidence, and "computed" outside Bangladesh with the global disclosure.
 */
export function RecordNotes({ series, world }: { series: PlaceSeries; world: { disclosure: string } | null }) {
  const t = useT();
  const { source, caveat, confidence } = series;
  return (
    <div className="space-y-1 text-small text-haze">
      <p>
        {source.kind === "cell"
          ? `${t("history.cell", { lat: source.lat, lon: source.lon })}${source.neighbour ? ` ${t("history.neighbour")}` : ""}`
          : source.label === null
            ? t("history.region")
            : t("data.text", { text: source.label })}
      </p>
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
