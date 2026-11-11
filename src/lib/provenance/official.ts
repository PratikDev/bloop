import { formatFixed, formatInteger, type BoundT, type Lang } from "@/lib/i18n";
import { PATTERN_ONLY } from "@/lib/data/official";
import type { FreshnessFile, OfficialLayer, OfficialManifest, OfficialValidationFile } from "@/types/data-contract";
import { versionOf } from "./live";
import { repoLink, rowLink, SCRIPTS, VALIDATION_TABLE } from "./repo";
import type { Provenance } from "./types";

const FRAME = /^(svs|eic_)/u;
const PLACEHOLDER = /^svs_related_/u;
const N_KEYS = ["n_points", "n", "n_pairs", "n_cells"] as const;

interface OfficialContext {
  t: BoundT;
  lang: Lang;
  freshness: FreshnessFile | null;
  place: string | null;
}

function sources(freshness: FreshnessFile | null, m: OfficialManifest): { names: string[]; link: string | null } {
  const reg = (freshness?.products[m.record]?.datasets ?? []).filter((d) => !FRAME.test(d.id) && !PLACEHOLDER.test(d.id));
  if (reg.length) return { names: reg.map((d) => d.name), link: reg.find((d) => d.url)?.url ?? null };
  const svs = (m.datasets ?? []).filter((d) => (d.common_name || d.name).trim());
  return { names: [...new Set(svs.map((d) => d.common_name || d.name))], link: svs.find((d) => d.url?.startsWith("http"))?.url ?? null };
}

function nOf(t: BoundT, lang: Lang, layer: OfficialLayer, validation: OfficialValidationFile | null): string | null {
  const check = validation?.checks.find((c) => c.id === layer.status_check);
  const metrics = check?.metrics ?? {};
  const key = N_KEYS.find((k) => typeof metrics[k] === "number");
  return key ? t("hwgt.n.points", { n: formatInteger(metrics[key] as number, lang) }) : null;
}

function cell(t: BoundT, lang: Lang, layer: OfficialLayer): string {
  const g = layer.grid;
  if (g.space === "frame") return t("hwgt.cell.frameSpace");
  return t("hwgt.cell.frame", {
    deg: formatFixed((g.bounds[2] - g.bounds[0]) / g.width, lang, 2),
    width: formatInteger(g.width, lang),
    height: formatInteger(g.height, lang),
    aggregation: t("data.text", { text: layer.aggregation }),
  });
}

export function officialProvenance(c: OfficialContext, m: OfficialManifest, layer: OfficialLayer, validation: OfficialValidationFile | null): Provenance {
  const { t, lang } = c;
  const src = sources(c.freshness, m);
  const dataset = src.names.length ? src.names.join("; ") : null;
  const pattern = layer.status === PATTERN_ONLY;
  const method = `${t("hwgt.method.official", { aggregation: t("data.text", { text: layer.aggregation }) })}${layer.encoding === "log10" ? ` ${t("hwgt.method.log")}` : ""}`;
  return {
    subject: t("hwgt.subject.record", { record: m.app_title }),
    dataset,
    version: dataset ? versionOf(dataset) : null,
    link: src.link,
    window: m.period.label,
    cell: cell(t, lang, layer),
    place: c.place,
    method,
    uncertainty: pattern ? null : layer.statement,
    n: nOf(t, lang, layer, validation),
    status: layer.status,
    scripts: (m.record.startsWith("rel_") ? SCRIPTS.related : SCRIPTS.official).map((p) => repoLink(p)),
    validation: rowLink(VALIDATION_TABLE, m.record),
    patternOnly: pattern ? t("hwgt.patternOnly", { why: t("data.text", { text: layer.statement ?? m.disclosure }) }) : null,
    health: m.record, 
  };
}
