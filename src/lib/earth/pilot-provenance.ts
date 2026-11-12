import { formatInteger, type BoundT, type Lang } from "@/lib/i18n";
import { repoLink } from "@/lib/provenance/repo";
import type { Provenance } from "@/lib/provenance/types";
import { DATA_SCRIPTS } from "./provenance";

/** How we got this for the pilot table: the archive's grids and FIRMS's daily counts, compared by Bloop's code. */
export function pilotProvenance(t: BoundT, lang: Lang, rows: number): Provenance {
  return {
    subject: t("earth.pilot.heading"),
    dataset: t("earth.pilot.dataset"),
    version: null,
    link: null,
    window: null,
    cell: t("earth.pilot.cell"),
    place: null,
    method: t("earth.pilot.method"),
    uncertainty: t("earth.pilot.noClaim"),
    n: t("earth.pilot.n", { n: formatInteger(rows, lang) }),
    status: null,
    scripts: [...DATA_SCRIPTS.pilot, ...DATA_SCRIPTS.fwi, ...DATA_SCRIPTS.firms].map((p) => repoLink(p)),
    validation: null,
    patternOnly: null,
  };
}
