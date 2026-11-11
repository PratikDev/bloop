"use client";

import { Button } from "@/components/ui/button";
import { downloadBlob } from "@/lib/download";
import { KIND_LABEL, WHAT_LABEL, type TimedPlayer } from "@/lib/timed-text/tracks";
import type { VttKind } from "@/lib/timed-text/vtt";
import { useAnnounce } from "../../Announcer/use-announcer";
import { useT } from "../../AppState/use-app-state";
import { Section } from "./parts";

const KINDS = ["captions", "chapters", "metadata"] as const satisfies readonly VttKind[];

export function TimedTextFiles({ player, files }: { player: TimedPlayer; files: Record<VttKind, string> }) {
  const t = useT();
  const announce = useAnnounce();
  const what = t(WHAT_LABEL[player]);
  const save = (kind: VttKind) => {
    const file = `bloop-${player}-${kind}.vtt`;
    downloadBlob(new Blob([files[kind]], { type: "text/vtt;charset=utf-8" }), file);
    announce(t("alt.saved", { file }));
  };
  return (
    <Section id="files" title={t("transcript.files")}>
      <p className="max-w-prose text-body text-haze">{t("transcript.filesLead", { what })}</p>
      <div className="flex flex-wrap gap-2">
        {KINDS.map((kind) => (
          <Button key={kind} variant="outline" onClick={() => save(kind)}>
            {t("transcript.download", { kind: t(KIND_LABEL[kind]) })}
          </Button>
        ))}
      </div>
    </Section>
  );
}
