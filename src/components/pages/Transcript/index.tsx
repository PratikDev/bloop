"use client";

import { getRouteApi, Link } from "@tanstack/react-router";
import { useLoaded } from "@/hooks/use-loaded";
import { loadOfficialIndex } from "@/lib/data";
import { FLAGS } from "@/lib/flags";
import { isLiveTranscript, LIVE_TITLE, LIVE_TRANSCRIPTS } from "@/lib/transcript";
import { useT } from "../../AppState/use-app-state";
import { NotFoundPage } from "../NotFound";
import { LiveTranscript } from "./LiveTranscript";
import { OfficialTranscript } from "./OfficialTranscript";
import { PAGE, TranscriptHeader } from "./parts";
import { appRecordTranscript } from "../../EarthRecords";

const route = getRouteApi("/transcript");

export function TranscriptPage() {
  const { record } = route.useSearch();
  if (!FLAGS.timedText) return <NotFoundPage />;
  if (record && isLiveTranscript(record)) return <LiveTranscript record={record} />;
  if (record) return appRecordTranscript(record) ?? <OfficialTranscript record={record} />;
  return <TranscriptList />;
}

function TranscriptList() {
  const t = useT();
  const { value: index } = useLoaded(loadOfficialIndex);
  const item = (record: string, label: string) => (
    <li key={record}>
      <Link to="/transcript" search={{ record }} className="text-body text-moon underline underline-offset-2">
        {label}
      </Link>
    </li>
  );
  return (
    <section aria-labelledby="transcript-title" className={PAGE}>
      <TranscriptHeader title={t("transcript.choose")} />
      <ul className="surface-plate space-y-2 rounded-plate p-5 md:p-6">
        {LIVE_TRANSCRIPTS.map((r) => item(r, t(LIVE_TITLE[r])))}
        {index?.records.map((r) => item(r.record, r.title))}
      </ul>
    </section>
  );
}
