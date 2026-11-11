"use client";

import { Link } from "@tanstack/react-router";
import { FLAGS } from "@/lib/flags";
import { useT } from "./AppState/use-app-state";

/** "Transcript: <record>": linked from the record, its liner notes and How we know. */
export function TranscriptLink({ record, label, className }: { record: string; label: string; className?: string }) {
  const t = useT();
  if (!FLAGS.timedText) return null;
  return (
    <Link to="/transcript" search={{ record }} className={className ?? "text-small text-moon underline underline-offset-2"}>
      {t("transcript.linkFor", { record: label })}
    </Link>
  );
}
