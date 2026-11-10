import { artProvenance } from "@/lib/art/provenance";
import type { CheckResult } from "@/lib/art/proof/check";
import { formatInteger, type BoundT, type Lang } from "@/lib/i18n";
import type { Provenance } from "@/lib/provenance/types";

/** Where the check's numbers come from (its "How we got this"). */
export function checkFacts(t: BoundT, lang: Lang, r: CheckResult): Provenance {
  const notes = r.kind === "drops" ? r.results[0].onsets.length : r.results[0].loggedHz.length;
  return artProvenance({
    subject: t("dial.hwgt.subject"),
    method: t("dial.hwgt.method"),
    uncertainty: t("dial.hwgt.uncertainty"),
    n: t("dial.hwgt.n", { notes: formatInteger(notes, lang) }),
    scripts: ["src/lib/art/proof/render.ts", "src/lib/art/proof/measure.ts", "src/lib/art/proof/check.ts"],
    test: "e2e/art/dial.e2e.ts",
  });
}
