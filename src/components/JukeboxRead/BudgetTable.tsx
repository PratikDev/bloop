"use client";

import { useMemo } from "react";
import { ERROR_BUDGET, liveBudget } from "@/lib/cv/error-budget";
import { budgetLines, errorText } from "@/lib/cv/budget-text";
import { formatInteger } from "@/lib/i18n";
import { useAppState, useT } from "../AppState/use-app-state";
import { useLiveData } from "../LiveData/use-live-data";
import { terrainField } from "../Scenes/terrain/field";

/**
 * Every pitch axis's error budget (public/data/meta/error_budget.json): the measured error, its cents, and what that
 * means. A flagged axis carries its warning; an axis with no source says "error not known", never 0; Sound terrain's
 * zoomed axis is computed from today's span.
 */
export function BudgetTable() {
  const { state } = useAppState();
  const t = useT();
  const { sst } = useLiveData();
  const span = useMemo(() => (sst ? terrainField(sst)?.axis : undefined), [sst]);
  const lang = state.lang;
  return (
    <table className="w-full text-left text-small" data-testid="budget-table">
      <caption className="sr-only">{t("cv.budget.all")}</caption>
      <thead className="text-haze">
        <tr>
          <th scope="col" className="py-1 pr-2 font-normal">{t("cv.budget.col.axis")}</th>
          <th scope="col" className="py-1 pr-2 font-normal">{t("cv.budget.col.error")}</th>
          <th scope="col" className="py-1 pr-2 font-normal">{t("cv.budget.col.cents")}</th>
          <th scope="col" className="py-1 font-normal">{t("cv.budget.col.note")}</th>
        </tr>
      </thead>
      <tbody>
        {ERROR_BUDGET.axes.map((axis) => {
          const b = liveBudget(axis, axis.dynamic ? span : undefined);
          const unit = axis.log ? "" : axis.unit;
          const lines = budgetLines(t, lang, b, unit);
          return (
            <tr key={axis.id} data-axis={axis.id} data-flag={b.flag ? "" : undefined} className="border-t border-glass-edge align-top">
              <th scope="row" className="py-1.5 pr-2 font-normal">{t("cv.axis", { id: axis.id })}</th>
              <td className="py-1.5 pr-2 tabular-nums">{errorText(lang, b, unit) ?? t("cv.budget.unknown")}</td>
              <td className="py-1.5 pr-2 tabular-nums" data-cents="">{b.cents === null ? "" : formatInteger(b.cents, lang)}</td>
              <td className="py-1.5" data-note="">{b.flag || b.cents === null ? lines[lines.length - 1] : t("cv.budget.ok")}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
