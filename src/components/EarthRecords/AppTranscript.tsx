"use client";

import type { Provenance } from "@/lib/provenance/types";
import { useT } from "../AppState/use-app-state";
import { Facts } from "../HowWeGotThis/Facts";
import { Lines, Loading, PAGE, Section, TranscriptHeader } from "../pages/Transcript/parts";

/** A DATA record's transcript, in the same parts as an Official record's (how the sound is made, what it covers,
 *  the pattern, how far to trust it), every line built by the record's own text module. */
export interface AppTranscriptData {
  title: string;
  mapping: string[];
  covers: string[];
  pattern: string[];
  trust: string[];
  facts: Provenance[];
}

export function AppTranscriptView({ data, error }: { data: AppTranscriptData | null; error: boolean }) {
  const t = useT();
  if (!data) {
    return (
      <section aria-labelledby="transcript-title" className={PAGE}>
        <TranscriptHeader title={t("transcript.choose")} />
        <Loading error={error} />
      </section>
    );
  }
  return (
    <section aria-labelledby="transcript-title" className={PAGE} data-testid="app-transcript">
      <TranscriptHeader title={t("transcript.title", { record: data.title })} lead={t("transcript.lead")} />
      <Section id="mapping" title={t("transcript.mapping")}>
        <Lines lines={data.mapping} />
      </Section>
      <Section id="covers" title={t("transcript.range")}>
        <Lines lines={data.covers} />
      </Section>
      <Section id="pattern" title={t("transcript.pattern")}>
        <Lines lines={data.pattern} />
      </Section>
      <Section id="trust" title={t("transcript.trust")}>
        <Lines lines={data.trust} />
        {data.facts.map((f) => (
          <Facts key={f.subject} t={t} facts={f} />
        ))}
      </Section>
    </section>
  );
}
