"use client";

import { proofPlan, PROOF_RECORDS } from "@/lib/art/proof/sources";
import { artProvenance } from "@/lib/art/provenance";
import { EARTH_CATEGORIES } from "@/lib/audio/layers/types";
import { getCategory, UNCLASSIFIED } from "@/lib/audio/orchestra";
import categories from "@/lib/audio/orchestra/categories.json";
import { FLAGS } from "@/lib/flags";
import { formatInteger } from "@/lib/i18n";
import { useAppState, useT } from "../AppState/use-app-state";
import { useLiveData } from "../LiveData/use-live-data";
import { Tile } from "../pages/How/Tile";
import { CategoryCheck } from "./Dial/CategoryCheck";
import { DialCheck } from "./Dial/DialCheck";
import { OrchestraLegend } from "./Orchestra/Legend";
import { RawPixelCard } from "./RawPixel";

/** ART's cards on How we know: the Earth Orchestra legend and the data voice check (each behind its flag). */
export function ArtHowCards() {
  const { state } = useAppState();
  const t = useT();
  const { fields } = useLiveData();
  const lang = state.lang;
  const placed = formatInteger(Object.keys(categories.records).length, lang);
  const unplaced = formatInteger(UNCLASSIFIED.length, lang);
  const orchestraFacts = [
    artProvenance({
      subject: t("orchestra.hwgt.subject"),
      method: t("orchestra.hwgt.method"),
      n: t("orchestra.hwgt.n", { records: placed }),
      scripts: ["scripts/orchestra-categories.ts", "src/lib/audio/orchestra/classify.ts", "src/lib/audio/orchestra/families.ts"],
      test: "src/lib/audio/orchestra/orchestra.test.ts",
    }),
  ];
  const proofFacts = [
    artProvenance({
      subject: t("dial.hwgt.subject"),
      method: t("dial.hwgt.method"),
      uncertainty: t("dial.hwgt.uncertainty"),
      scripts: ["src/lib/art/proof/render.ts", "src/lib/art/proof/measure.ts", "src/lib/art/proof/check.ts"],
      test: "src/lib/art/proof/check.ts",
    }),
  ];
  return (
    <>
      {FLAGS.artOrchestra && (
        <Tile
          title={t("orchestra.title")}
          figure={t("orchestra.figure", { count: formatInteger(EARTH_CATEGORIES.length, lang) })}
          figureLabel={t("orchestra.figureLabel")}
          face={
            <div className="space-y-2">
              <p className="text-small text-moon" data-testid="card-numbers">{t("orchestra.numbers", { records: placed, unclassified: unplaced })}</p>
              <p className="text-small text-haze">{t("orchestra.explain")}</p>
            </div>
          }
          open={t("orchestra.open")}
          facts={orchestraFacts}
        >
          <OrchestraLegend />
        </Tile>
      )}
      {FLAGS.artDial && (
        <Tile title={t("proof.title")} figure={t("proof.limit")} figureLabel={t("proof.figureLabel")} face={<p className="text-small text-haze">{t("proof.explain")}</p>} open={t("proof.open")} facts={proofFacts}>
          <div className="space-y-4" data-testid="proof-card">
            {PROOF_RECORDS.map((r) => (
              <div key={r} data-record={r}>
                <DialCheck plan={() => proofPlan(r, fields)} timbre={getCategory(r) ?? "plain"} label={t(`proof.record.${r}`)} />
              </div>
            ))}
            <CategoryCheck plan={() => proofPlan("ocean", fields)} />
          </div>
        </Tile>
      )}
      {FLAGS.artRawPixel && <RawPixelCard />}
    </>
  );
}
