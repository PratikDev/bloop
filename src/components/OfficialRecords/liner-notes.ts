import { abbrev, clean } from "@/a11y/brailleText";
import type { BoundT } from "@/lib/i18n";
import { collapseRange, plainStatement } from "@/lib/official-text";
import type { OfficialManifest, OfficialValidationFile } from "@/types/data-contract";

const RESULT = { pass: "official.check.pass", miss: "official.check.miss", none: "official.check.none" } as const;

/** A record's liner notes as plain lines, most important first: what it is, how far to trust it, then credits. */
export function linerNotes(t: BoundT, manifest: OfficialManifest, validation: OfficialValidationFile | null): string[] {
  const checks = validation?.checks ?? manifest.validation;
  return [
    clean(`SVS ${manifest.svs_ids.join(", ")}: ${manifest.app_title}`),
    clean(`${t("official.period")}: ${collapseRange(manifest.period.label)}. ${abbrev(manifest.badge)}.`),
    ...manifest.layers.map((l) => clean(`${l.label}: ${l.status}${l.statement ? `. ${plainStatement(l.statement)}` : ""}`)),
    "",
    clean(`${t("official.checks")}:`),
    ...checks.map((c) => clean(`${c.title}: ${t(RESULT[c.pass === null ? "none" : c.pass ? "pass" : "miss"])}${c.decision ? `. ${c.decision.statement}` : ""}`)),
    "",
    clean(manifest.disclosure),
    clean(`${t("official.credits")}: ${manifest.credit_line}`),
    ...Object.entries(manifest.credits_by_role).map(([role, people]) => clean(`${role}: ${people.join("; ")}`)),
    clean(`${t("official.licence")}: ${manifest.licence}`),
  ];
}
