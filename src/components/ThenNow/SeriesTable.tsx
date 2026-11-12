"use client";

import { useT } from "../AppState/use-app-state";
import { Fold } from "./Layout";

/** A chart's numbers as a real table, for screen readers and anyone who wants the exact values. Null cells say so. */
export function SeriesTable({ caption, headers, rows }: { caption: string; headers: readonly string[]; rows: readonly (readonly (string | null)[])[] }) {
  const t = useT();
  return (
    <Fold title={t("table.title")}>
      <div className="max-h-72 overflow-auto">
        <table className="w-full text-left text-small tabular-nums">
          <caption className="pb-2 text-left text-haze">{caption}</caption>
          <thead>
            <tr>
              {headers.map((header) => (
                <th key={header} scope="col" className="border-b-2 border-navy py-1 pr-3 font-semibold">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j} className="py-0.5 pr-3">
                    {cell ?? t("table.missing")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Fold>
  );
}
