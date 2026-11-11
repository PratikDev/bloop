"use client";

import { useT } from "../../AppState/use-app-state";
import { Facts } from "../../HowWeGotThis/Facts";
import { Lines, Loading, PAGE, Section, TranscriptHeader } from "./parts";
import { useOfficialTranscript } from "./use-official-transcript";

export function OfficialTranscript({ record }: { record: string }) {
  const t = useT();
  const { data, error } = useOfficialTranscript(record);
  if (!data) {
    return (
      <section aria-labelledby="transcript-title" className={PAGE}>
        <TranscriptHeader title={t("transcript.choose")} />
        <Loading error={error} />
      </section>
    );
  }
  return (
    <section aria-labelledby="transcript-title" className={PAGE}>
      <TranscriptHeader title={t("transcript.title", { record: data.title })} lead={t("transcript.lead")} />
      <Section id="mapping" title={t("transcript.mapping")}>
        <Lines lines={data.mapping} />
      </Section>
      <Section id="covers" title={t("transcript.range")}>
        <Lines lines={data.covers} />
      </Section>
      <Section id="pattern" title={t("transcript.pattern")}>
        <Lines lines={data.pattern} lang="en" />
      </Section>
      {data.moments.length > 0 && (
        <Section id="moments" title={t("transcript.moments")}>
          <Lines lines={data.moments} />
        </Section>
      )}
      <Section id="trust" title={t("transcript.trust")}>
        <Lines lines={data.notes} />
        {data.provenance && <Facts t={t} facts={data.provenance} />}
      </Section>
      <Section id="svs" title={t("transcript.svs")}>
        <Lines lines={[data.svs.description]} lang="en" />
        <p className="text-small text-haze">{t("transcript.svsCredit", { ids: data.svs.ids })}</p>
        <ul className="space-y-1 text-small">
          {data.svs.pages.map((href) => (
            <li key={href}>
              <a href={href} target="_blank" rel="noreferrer" className="break-all text-moon underline underline-offset-2">
                {href}
              </a>
            </li>
          ))}
        </ul>
      </Section>
    </section>
  );
}
