"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { categorySetups, checkPlan, type CheckResult } from "@/lib/art/proof/check";
import type { ProofPlan } from "@/lib/art/proof/plan";
import { EARTH_CATEGORIES } from "@/lib/audio/layers/types";
import { formatFixed, formatInteger } from "@/lib/i18n";
import { useAppState, useT } from "../../AppState/use-app-state";
import { useCommands } from "../../Commands/use-commands";
import { checkLine, detail } from "./DialCheck";

/** Every Earth Orchestra family (as the live voice and as OrchestraApi notes) against the art-off render. */
export function CategoryCheck({ plan }: { plan: () => Promise<ProofPlan | null> }) {
  const { state } = useAppState();
  const t = useT();
  const commands = useCommands();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const line = (r: CheckResult) =>
    r.pass
      ? t("proof.categories.pass", {
          families: formatInteger(EARTH_CATEGORIES.length, state.lang),
          cents: formatFixed(r.maxCents, state.lang, 3),
          notes: formatInteger(r.results[0].loggedHz.length, state.lang),
        })
      : checkLine(t, state.lang, r);
  async function run() {
    setBusy(true);
    try {
      const p = await plan();
      if (!p) return;
      const r = await checkPlan(p, categorySetups());
      setResult(r);
      void commands.say((bt, lang) => (r.pass ? bt("proof.categories.pass", { families: formatInteger(EARTH_CATEGORIES.length, lang), cents: formatFixed(r.maxCents, lang, 3), notes: formatInteger(r.results[0].loggedHz.length, lang) }) : checkLine(bt, lang, r)));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-2" data-testid="category-check" data-pass={result ? String(result.pass) : undefined} data-cents={result ? String(result.maxCents) : undefined} data-detail={result ? detail(result) : undefined}>
      <Button variant="outline" className="h-11" disabled={busy} onClick={run}>
        {t("proof.categories")}
      </Button>
      <p className="text-small text-moon">{busy ? t("dial.checking") : result ? line(result) : ""}</p>
    </div>
  );
}
