"use client";

import { Button } from "@/components/ui/button";
import { partMidi, partSheet, type MidiPart } from "@/lib/art/then-now-midi";
import type { ThenNowInput } from "@/lib/audio/types";
import { downloadBlob } from "@/lib/download";
import { FLAGS } from "@/lib/flags";
import { useT } from "../AppState/use-app-state";

export function ThenNowMidi({ input, part, city }: { input: ThenNowInput; part: string; city: string }) {
  const t = useT();
  if (!FLAGS.artLifetime || (part !== "heat" && part !== "monsoon" && part !== "water")) return null;
  const p: MidiPart = part;
  const name = `bloop-then-now-${city.toLowerCase()}-${p}`;
  return (
    <div className="flex flex-wrap gap-2" data-testid="then-now-midi">
      {p !== "monsoon" && (
        <Button variant="outline" className="h-11" onClick={() => downloadBlob(new Blob([partMidi(input, p).slice().buffer], { type: "audio/midi" }), `${name}.mid`)}>
          {t("midi.download")}
        </Button>
      )}
      <Button variant="outline" className="h-11" onClick={() => downloadBlob(new Blob([partSheet(`${city}, ${p}`, input, p)], { type: "text/plain;charset=utf-8" }), `${name}.txt`)}>
        {t("midi.sheet")}
      </Button>
    </div>
  );
}
