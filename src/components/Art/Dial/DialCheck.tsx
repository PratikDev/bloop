"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ensureAudioAll } from "@/lib/audio-engines";
import { checkPlan, dialSetups, type CheckResult } from "@/lib/art/proof/check";
import type { ProofPlan } from "@/lib/art/proof/plan";
import type { Timbre } from "@/lib/audio/orchestra";
import { formatFixed, formatInteger, type BoundT, type Lang } from "@/lib/i18n";
import { useAppState, useT } from "../../AppState/use-app-state";
import { useCommands } from "../../Commands/use-commands";
import { HowWeGotThis } from "../../HowWeGotThis";
import { checkFacts } from "./check-facts";

export function checkLine(t: BoundT, lang: Lang, r: CheckResult): string {
  const stops = formatInteger(r.results.length, lang);
  if (!r.pass) return t("dial.check.fail", { cents: formatFixed(r.maxCents, lang, 3) });
  if (r.kind === "drops") return t("dial.check.drops", { onsets: formatInteger(r.results[0].onsets.length, lang), stops });
  return t("dial.check.pass", { cents: formatFixed(r.maxCents, lang, 3), notes: formatInteger(r.results[0].loggedHz.length, lang), stops });
}

export const detail = (r: CheckResult) =>
  JSON.stringify(r.results.map((x) => ({ stop: x.setup.stop, timbre: x.setup.timbre, path: x.setup.path, vsRule: Number(x.centsVsRule.toFixed(4)), vsOff: Number(x.centsVsOff.toFixed(4)), onsets: x.onsets.length })));

export function DialCheck({ plan, timbre, label, ready = true }: { plan: () => Promise<ProofPlan | null>; timbre: Timbre; label?: string; ready?: boolean }) {
  const { state } = useAppState();
  const t = useT();
  const commands = useCommands();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<CheckResult | null | "none">(null);

  async function run() {
    setBusy(true);
    try {
      await ensureAudioAll().catch(() => undefined);
      const p = await plan();
      const r = p ? await checkPlan(p, dialSetups(timbre)) : null;
      setResult(r ?? "none");
      void commands.say((bt, lang) => (r ? checkLine(bt, lang, r) : bt("dial.check.none")));
    } finally {
      setBusy(false);
    }
  }

  const done = result !== null && result !== "none";
  return (
    <div className="space-y-2" data-provenance-group="" data-testid="dial-check" data-pass={done ? String(result.pass) : undefined} data-cents={done ? String(result.maxCents) : undefined} data-detail={done ? detail(result) : undefined}>
      <Button variant="outline" className="h-11" disabled={busy || !ready} onClick={run}>
        {label ?? t("dial.check")}
      </Button>
      <p className="text-small text-moon" data-testid="dial-check-line">
        {busy ? t("dial.checking") : result === "none" ? t("dial.check.none") : done ? checkLine(t, state.lang, result) : ""}
      </p>
      {done && <HowWeGotThis facts={[checkFacts(t, state.lang, result)]} />}
    </div>
  );
}
