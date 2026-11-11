"use client";

import { brailleLabel } from "@/a11y/aria";
import type { ValueChordState } from "@/hooks/use-value-chord";
import { formatFixed } from "@/lib/i18n";
import { repoLink } from "@/lib/provenance/repo";
import type { Provenance } from "@/lib/provenance/types";
import { sigDecimals } from "@/lib/cv/text";
import { useAppState, useT } from "../AppState/use-app-state";
import { HowWeGotThis, ProvenanceGroup } from "../HowWeGotThis";
import { ChordToggle } from "./ChordToggle";

const CHORD_SCRIPTS = ["src/lib/audio/layers/chord/modes.ts", "src/lib/audio/layers/chord/index.ts", "pipeline/stats/chord_allowlist.py", "pipeline/tests/test_colormap_invariance.py"];

export function ChordControls({ chord, unit, base }: { chord: ValueChordState; unit: string; base: Provenance | null }) {
  const t = useT();
  const { state } = useAppState();
  const sigma = chord.sigma === null ? null : `${formatFixed(chord.sigma, state.lang, sigDecimals(chord.sigma))}${unit ? ` ${unit}` : ""}`;
  const facts: Provenance[] = [
    {
      subject: t("cv.hwgt.chord.subject"),
      dataset: base?.dataset ?? null,
      version: base?.version ?? null,
      link: base?.link ?? null,
      window: base?.window ?? null,
      cell: base?.cell ?? null,
      place: null,
      method: t("cv.hwgt.chord.method"),
      uncertainty: sigma === null ? null : t("cv.hwgt.chord.unc", { sigma }),
      n: null,
      status: base?.status ?? null,
      scripts: CHORD_SCRIPTS.map((s) => repoLink(s)),
      validation: base?.validation ?? null,
      patternOnly: null,
    },
  ];
  return (
    <ProvenanceGroup className="space-y-2 border-t border-glass-edge pt-3">
      <ChordToggle />
      <p data-testid="chord-text" data-block={chord.gate.block ?? undefined}>
        {chord.text}
      </p>
      {chord.gate.modesOnly && <p className="text-small text-haze">{t("cv.chord.modesOnly")}</p>}
      {chord.short && (
        <p className="text-small text-haze">
          {t("cv.read.short")}:{" "}
          <span lang="en" data-testid="chord-short" className="font-mono text-moon" {...brailleLabel(chord.short)}>
            {chord.short}
          </span>
        </p>
      )}
      <HowWeGotThis facts={facts} />
    </ProvenanceGroup>
  );
}
