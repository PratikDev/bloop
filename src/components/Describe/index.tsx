"use client";

import { SpeakerHigh } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { describeRecord } from "@/lib/describe/compose";
import { categoryLead } from "@/lib/art/category-lead"; // Category word first
import { LIVE_TITLE } from "@/lib/transcript";
import { useAppState, useT } from "../AppState/use-app-state";
import { Fold } from "../ThenNow/Layout";
import { TranscriptLink } from "../TranscriptLink";
import { useDescribeHere } from "./use-describe-here";
import { useDescription } from "./use-description";

/**
 * The description of the needle, as text (accessibility core, step 3): the same words D says, at the chosen detail,
 * following the needle. Detailed adds "What this means" in its own fold, apart from the data text.
 */
export function DescriptionPanel() {
  const { state } = useAppState();
  const t = useT();
  const facts = useDescription(true);
  const say = useDescribeHere();
  const records = facts ? facts(state.lang).map((f) => ({ record: f.record, d: describeRecord(f, state.verbosity, state.lang) })) : null;

  return (
    <div className="space-y-4" data-testid="description-panel">
      {records === null ? (
        <p className="text-haze">{t("describe.loading")}</p>
      ) : (
        records.map(({ record, d }) => (
          <section key={record} className="space-y-2">
            <p>{[...categoryLead(t, record), ...d.data].join(" ")}</p>
            <TranscriptLink record={record} label={t(LIVE_TITLE[record])} />
            {d.meaning && (
              <Fold title={t("describe.meaning")}>
                <p>{d.meaning}</p>
              </Fold>
            )}
          </section>
        ))
      )}
      <div className="flex flex-wrap items-center gap-3 border-t border-glass-edge pt-3">
        <Button variant="outline" size="lg" disabled={!say} onClick={() => say?.()} className="h-11 gap-2 rounded-full">
          <SpeakerHigh aria-hidden="true" className="size-4" />
          {t("describe.say")}
        </Button>
        <p className="text-small text-haze">{t("describe.note")}</p>
      </div>
    </div>
  );
}
