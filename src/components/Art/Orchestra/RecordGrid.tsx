"use client";

import { EARTH_CATEGORIES, type EarthCategory } from "@/lib/audio/layers/types";
import { getCategory } from "@/lib/audio/orchestra";
import { useT } from "../../AppState/use-app-state";
import { ChoiceGroup, type Choice } from "../../ChoiceGroup";
import { CATEGORY_ICONS } from "./icons";

type Group = EarthCategory | "unplaced";
const GROUPS: readonly Group[] = [...EARTH_CATEGORIES, "unplaced"];

export interface GridRecord {
  record: string;
  title: string;
  brailleLabel?: string;
}

/** Records grouped by Earth system (getCategory), in the families' order; unplaced records last. */
export function groupRecords<R extends GridRecord>(records: readonly R[]): { group: Group; records: R[] }[] {
  return GROUPS.map((group) => ({ group, records: records.filter((r) => (getCategory(r.record) ?? "unplaced") === group) })).filter((g) => g.records.length);
}

/**
 * The Official records grouped by Earth system (Earth Orchestra): one labelled group per system, with its icon and name;
 * the chosen record is pressed in its group. Groups whatever records the index lists.
 */
export function RecordGrid({ records, value, onChange }: { records: readonly GridRecord[]; value: string; onChange: (record: string) => void }) {
  const t = useT();
  return (
    <div className="space-y-3" data-testid="record-grid" role="group" aria-label={t("orchestra.grid")}>
      {groupRecords(records).map(({ group, records: inGroup }) => {
        const Icon = CATEGORY_ICONS[group];
        const name = group === "unplaced" ? t("orchestra.unplaced") : t(`orchestra.cat.${group}`);
        const options: Choice<string>[] = inGroup.map((r) => ({ value: r.record, label: r.title, brailleLabel: r.brailleLabel }));
        return (
          <section key={group} className="space-y-1.5" data-category={group}>
            <h3 className="flex items-center gap-2 text-small text-haze">
              <Icon aria-hidden="true" className="size-4" />
              {name}
            </h3>
            <ChoiceGroup label={name} value={value} onChange={onChange} options={options} className="flex-wrap" />
          </section>
        );
      })}
    </div>
  );
}
