"use client";

import { useLoaded } from "@/hooks/use-loaded";
import { loadHiddenRelated } from "@/lib/earth/hidden";
import { FLAGS } from "@/lib/flags";
import { hiddenProvenance } from "@/lib/earth/provenance";
import { useAppState, useT } from "../AppState/use-app-state";
import { HowWeGotThis } from "../HowWeGotThis";

/**
 * "Not playable: too sparse to sonify honestly": the related records the pipeline marks hidden, at the foot of
 * Official records, each with the pipeline's reason. They stay unplayable: no button, no voice.
 */
export function NotPlayable() {
  const t = useT();
  const { state } = useAppState();
  const { value: rows } = useLoaded(loadHiddenRelated, FLAGS.dataLeftovers);
  if (!FLAGS.dataLeftovers) return null;
  return (
    <section aria-labelledby="not-playable" className="space-y-2" data-testid="not-playable" data-provenance-group="">
      <h3 id="not-playable" className="text-body font-medium">
        {t("earth.notPlayable.heading")}
      </h3>
      <p className="text-haze">{t("earth.notPlayable.lead")}</p>
      {!rows ? (
        <p className="text-small text-haze">{t("earth.notPlayable.loading")}</p>
      ) : (
        <ul className="space-y-1.5">
          {rows.map((r) => (
            <li key={r.record} data-record={r.record} className="text-body">
              <span lang="en" className="text-moon">{r.title}</span>
              <span className="text-haze">: </span>
              <span lang="en" className="text-haze">{r.reason}</span>
            </li>
          ))}
        </ul>
      )}
      {rows && <HowWeGotThis facts={[hiddenProvenance(t, state.lang, rows.length)]} />}
    </section>
  );
}
