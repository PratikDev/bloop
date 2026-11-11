"use client";

import { useCallback } from "react";
import { useLoaded } from "@/hooks/use-loaded";
import { checkResult, keyNumbers, loadLiveCheck, type LiveCheckRecord } from "@/lib/provenance/live-checks";
import { useT } from "../AppState/use-app-state";

export function LiveCheckFacts({ record }: { record: LiveCheckRecord }) {
  const t = useT();
  const load = useCallback(() => loadLiveCheck(record), [record]);
  const { value: file, status } = useLoaded(load);
  if (status === "loading") return <p className="text-small text-haze">{t("earth.check.loading")}</p>;
  if (!file) return null;
  return (
    <section className="space-y-1.5 border-t border-tide pt-3" data-testid="live-check" data-live-check={record}>
      <h3 className="text-lead font-medium text-moon">{t("earth.check.heading")}</h3>
      <ul className="space-y-1 text-body">
        {file.checks.map((c) => (
          <li key={c.id} data-key-numbers={keyNumbers(c.metrics)}>
            <span lang="en">{t("earth.check.line", { title: c.title, numbers: keyNumbers(c.metrics), result: checkResult(c) })}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
