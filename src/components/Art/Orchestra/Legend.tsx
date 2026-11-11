"use client";

import { Play } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { playReferenceNote } from "@/lib/art/live/play";
import { useSoundStart } from "@/hooks/use-sound-start";
import { EARTH_CATEGORIES } from "@/lib/audio/layers/types";
import { FAMILIES, UNCLASSIFIED } from "@/lib/audio/orchestra";
import { useT } from "../../AppState/use-app-state";
import { CATEGORY_ICONS } from "./icons";

/**
 * Earth Orchestra's legend: each Earth system, its instrument and why, and a button that plays the family on one
 * fixed reference note (never data). A real table, so a screen reader reads it row by row.
 */
export function OrchestraLegend() {
  const t = useT();
  const soundStart = useSoundStart();
  const demo = async (c: (typeof EARTH_CATEGORIES)[number]) => {
    await soundStart();
    playReferenceNote(FAMILIES[c]);
  };
  return (
    <div className="space-y-2" data-testid="orchestra-legend">
      <table className="w-full text-left text-small">
        <caption className="sr-only">{t("orchestra.title")}</caption>
        <thead className="text-haze">
          <tr>
            <th scope="col" className="py-1 pr-2 font-normal">{t("orchestra.col.system")}</th>
            <th scope="col" className="py-1 pr-2 font-normal">{t("orchestra.col.instrument")}</th>
            <th scope="col" className="py-1 font-normal">{t("orchestra.col.demo")}</th>
          </tr>
        </thead>
        <tbody>
          {EARTH_CATEGORIES.map((c) => {
            const Icon = CATEGORY_ICONS[c];
            const system = t(`orchestra.cat.${c}`);
            return (
              <tr key={c} className="border-t border-glass-edge align-top" data-category={c}>
                <th scope="row" className="py-1.5 pr-2 font-normal text-moon">
                  <span className="flex items-center gap-1.5">
                    <Icon aria-hidden="true" className="size-4 shrink-0" />
                    {system}
                  </span>
                </th>
                <td className="py-1.5 pr-2">
                  <span className="block text-moon">{t(`orchestra.inst.${c}`)}</span>
                  <span className="block text-haze">{t(`orchestra.why.${c}`)}</span>
                </td>
                <td className="py-1.5">
                  <Button variant="outline" size="sm" className="h-9 gap-1" aria-label={t("orchestra.demo", { system })} onClick={() => void demo(c)}>
                    <Play aria-hidden="true" className="size-3.5" />
                    {t("orchestra.demoShort")}
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-small text-haze">{t("orchestra.reference")}</p>
      <p className="text-small text-haze">{t("orchestra.unclassified", { list: UNCLASSIFIED.map((u) => u.id).join(", ") })}</p>
      <p className="text-small text-moon">{t("orchestra.interpretation")}</p>
    </div>
  );
}
