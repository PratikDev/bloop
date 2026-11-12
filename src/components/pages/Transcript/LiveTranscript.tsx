"use client";

import { voiceSpec } from "@/lib/audio/mapping";
import type { BoundT } from "@/lib/i18n";
import { WHAT_LABEL, type TimedPlayer } from "@/lib/timed-text/tracks";
import { LIVE_TITLE, momentClock, moments, type LiveTranscript as LiveRecord } from "@/lib/transcript";
import { useAppState, useT } from "../../AppState/use-app-state";
import { Facts } from "../../HowWeGotThis/Facts";
import { Lines, Loading, Moments, PAGE, Section, TranscriptHeader } from "./parts";
import { TimedTextFiles } from "./TimedTextFiles";
import { useLiveTranscript } from "./use-live-transcript";

const VOICES = { ocean: ["ocean"], rain: ["rain", "snow"] } as const satisfies Record<LiveRecord, readonly string[]>;
const PLAYER = { ocean: "sweep", rain: "timelapse" } as const satisfies Record<LiveRecord, TimedPlayer>;

/** How the sound is made, in words: each voice's rule from mapping.json, then what silence means and the grammar. */
const mappingLines = (t: BoundT, record: LiveRecord) => [...VOICES[record].map((v) => t("mapping.rule", { voice: voiceSpec(v) })), t("tuning.nodata"), t("tuning.grammar")];

export function LiveTranscript({ record }: { record: LiveRecord }) {
  const { state } = useAppState();
  const t = useT();
  const data = useLiveTranscript(record);
  const title = t(LIVE_TITLE[record]);
  const player = PLAYER[record];
  return (
    <section aria-labelledby="transcript-title" className={PAGE}>
      <TranscriptHeader title={t("transcript.title", { record: title })} lead={t("transcript.lead")} />
      <Section id="mapping" title={t("transcript.mapping")}>
        <Lines lines={mappingLines(t, record)} />
      </Section>
      {!data ? (
        <Loading error={false} />
      ) : (
        <>
          <Section id="covers" title={t("transcript.range")}>
            <Lines lines={data.covers} />
          </Section>
          <Section id="pattern" title={t("transcript.pattern")}>
            <Lines lines={data.pattern} />
          </Section>
          {data.meaning && (
            <Section id="meaning" title={t("transcript.meaning")}>
              <Lines lines={[data.meaning]} />
            </Section>
          )}
          <Section id="moments" title={t("transcript.moments")}>
            {data.built ? (
              <>
                <p className="text-small text-haze">{t("transcript.momentsLead", { what: t(WHAT_LABEL[player]) })}</p>
                <Moments items={moments(data.built.tracks[state.lang].captions).map((m) => ({ time: momentClock(m.sec, state.lang), text: m.text }))} />
              </>
            ) : data.builtError ? (
              <p className="text-body text-haze">{t("transcript.momentsNone")}</p>
            ) : (
              <Loading error={false} />
            )}
          </Section>
          {data.provenance && (
            <Section id="trust" title={t("transcript.trust")}>
              <Facts t={t} facts={data.provenance} />
            </Section>
          )}
          <Section id="svs" title={t("transcript.svs")}>
            <Lines lines={[t("transcript.noSvs", { dataset: data.dataset ?? t("hwgt.na") })]} />
          </Section>
          {data.built && <TimedTextFiles player={player} files={data.built.files[state.lang]} />}
        </>
      )}
    </section>
  );
}
