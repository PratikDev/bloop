"use client";

import { loadRelatedIndex } from "@/lib/data";
import type { MessageKey } from "@/lib/i18n";
import { useLoaded } from "@/hooks/use-loaded";
import type { OfficialIndexRow } from "@/types/data-contract";
import { useT } from "../AppState/use-app-state";
import { ChoiceGroup } from "../ChoiceGroup";
import { StatusBadge } from "../StatusBadge";

/** The EIC focus areas in display order; a record's `focus` names one of them (pipeline/svs/focus.py). */
const FOCUS: readonly { id: string; key: MessageKey }[] = [
  { id: "sea level", key: "official.focus.sea level" },
  { id: "air quality", key: "official.focus.air quality" },
  { id: "biodiversity", key: "official.focus.biodiversity" },
  { id: "wildfires", key: "official.focus.wildfires" },
  { id: "greenhouse gases", key: "official.focus.greenhouse gases" },
  { id: "energy", key: "official.focus.energy" },
  { id: "disasters", key: "official.focus.disasters" },
  { id: "water resources", key: "official.focus.water resources" },
  { id: "agriculture", key: "official.focus.agriculture" },
  { id: "other", key: "official.focus.other" },
];

/** Official → Related: records NASA may add, grouped by focus area, each labelled with the official item it sits beside. */
export function RelatedRecords({ value, onChange }: { value: string; onChange: (record: string) => void }) {
  const t = useT();
  const { value: index, error } = useLoaded(loadRelatedIndex);
  if (error) return <StatusBadge kind="error">{t("official.related.error")}</StatusBadge>;
  if (!index) return <StatusBadge kind="loading">{t("official.related.loading")}</StatusBadge>;
  const label = (r: OfficialIndexRow) =>
    r.related_to?.length ? `${r.title} (${t("official.related.beside", { ids: r.related_to.join(", ") })})` : r.title;
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <h3 className="text-body font-medium">{t("official.related.heading")}</h3>
        <p className="text-haze">{t("official.related.intro")}</p>
      </div>
      {FOCUS.map((f) => {
        const rows = index.records.filter((r) => (r.focus ?? "other") === f.id);
        if (!rows.length) return null;
        return (
          <div key={f.id} className="space-y-1">
            <p className="text-haze">{t(f.key)}</p>
            <ChoiceGroup label={t(f.key)} value={value} onChange={onChange} className="flex-wrap"
              options={rows.map((r) => ({ value: r.record, label: label(r) }))} />
          </div>
        );
      })}
    </div>
  );
}
