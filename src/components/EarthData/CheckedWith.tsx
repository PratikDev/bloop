"use client";

import { useCallback } from "react";
import { useLoaded } from "@/hooks/use-loaded";
import { loadOfficialValidation } from "@/lib/data/official";
import { checkedWith } from "@/lib/earth/checked-with";
import { useT } from "../AppState/use-app-state";

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
