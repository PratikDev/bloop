"use client";

import { TABLE_REACH } from "@/a11y/mapNav";
import { formatAxis, formatRainRate, formatTemperature, type BoundT, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { OceanValue, RainValue } from "@/types/data-contract";
import { useAppState, useT } from "../AppState/use-app-state";
import { useTableValues, type TableRecord, type ValueTableData } from "./use-table-values";

const RECORD_LABEL = { ocean: "frame.product.ocean", rain: "frame.product.rain" } as const satisfies Record<TableRecord, string>;
const UNIT_LABEL = { ocean: "table.unit.celsius", rain: "table.unit.mmPerHour" } as const satisfies Record<TableRecord, string>;

/** One cell's value in words a screen reader reads well (the unit is in the caption). */
function cellText(v: OceanValue | RainValue, t: BoundT, lang: Lang): string {
  if (v.track === "ocean") return v.valueC === null ? t("table.none") : formatTemperature(v.valueC, lang);
  if (v.mmPerHour === null || v.phase === "nodata") return t("table.none");
  return v.mmPerHour === 0 ? t("table.dry") : formatRainRate(v.mmPerHour, lang);
}

function RecordTable({ data, step }: { data: ValueTableData; step: number }) {
  const { state } = useAppState();
  const t = useT();
  return (
    // A table wider than the drawer scrolls; the region takes focus so a keyboard can scroll it (axe: scrollable-region-focusable).
    <div role="region" aria-label={t(RECORD_LABEL[data.record])} tabIndex={0} className="overflow-x-auto rounded-lg ring-1 ring-glass-edge focus-visible:ring-2 focus-visible:ring-shapla">
      <table className="w-full border-collapse text-small tabular-nums">
        <caption className="px-2 pt-2 pb-1 text-left text-small text-haze">
          {t("table.valuesCaption", { record: t(RECORD_LABEL[data.record]), unit: t(UNIT_LABEL[data.record]), timeUtc: data.timeUtc, step: formatAxis(step, state.lang) })}
        </caption>
        <thead>
          <tr>
            <th scope="col" className="px-2 py-1 text-left font-normal text-haze">
              {t("table.corner")}
            </th>
            {data.lons.map((lon, c) => (
              <th key={c} scope="col" className="px-2 py-1 text-right font-normal whitespace-nowrap text-haze">
                {t("table.lon", { lon })}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.lats.map((lat, r) => (
            <tr key={r} className="border-t border-glass-edge">
              <th scope="row" className="px-2 py-1 text-left font-normal whitespace-nowrap text-haze">
                {t("table.lat", { lat })}
              </th>
              {data.values[r].map((v, c) => {
                const needle = r === TABLE_REACH && c === TABLE_REACH;
                return (
                  <td key={c} className={cn("px-2 py-1 text-right", needle && "font-semibold text-moon ring-2 ring-shapla ring-inset")}>
                    {cellText(v, t, state.lang)}
                    {needle && <span className="sr-only">, {t("table.needle")}</span>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * "View as table" (accessibility core, step 4; spec Part 1.4): the values around the needle as a real table, with a
 * caption, headers and units, one arrow-key step apart; read from the grid the sound plays.
 */
export function ValueTable() {
  const { state } = useAppState();
  const t = useT();
  const tables = useTableValues();
  return (
    <div className="space-y-4" data-testid="value-table">
      {tables === null ? <p className="text-haze">{t("table.loading")}</p> : tables.map((d) => <RecordTable key={d.record} data={d} step={state.stepDeg} />)}
    </div>
  );
}
