"use client";

import { useCallback } from "react";
import { useLoaded } from "@/hooks/use-loaded";
import { loadOfficialValidation } from "@/lib/data/official";
import { checkedWith } from "@/lib/earth/checked-with";
import { useT } from "../AppState/use-app-state";

/**
 * "Also checked with" (P6): the other SVS items and datasets a record's own checks were run against, read from its
 * validation.json (e.g. ocean2_5425 is checked with SVS 5479's flat maps and GLORYS12). Credited, never played.
 */
export function CheckedWith({ record }: { record: string }) {
  const t = useT();
  const load = useCallback(() => loadOfficialValidation(record), [record]);
  const { value } = useLoaded(load);
  const items = value ? checkedWith(value) : [];
  if (!items.length) return null;
  return (
    <section className="space-y-1.5 border-t border-tide pt-3" data-testid="checked-with">
      <h3 className="text-lead font-medium text-moon">{t("earth.checkedWith.heading")}</h3>
      <ul className="space-y-1 text-body">
        {items.map((i) => (
          <li key={i.svs} data-svs={i.svs}>
            <a href={i.link} target="_blank" rel="noreferrer" className="underline underline-offset-2">
              {t("earth.checkedWith.svs", { id: String(i.svs) })}
            </a>
            : <span lang="en">{i.checks.join("; ")}</span>
            {i.sources.length > 0 && <span className="block text-small text-haze" lang="en">{i.sources.join("; ")}</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}
