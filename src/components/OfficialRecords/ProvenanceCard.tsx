"use client";

import { Fragment } from "react";
import { formatFixed, type MessageKey } from "@/lib/i18n";
import { collapseRange } from "@/lib/official-text";
import type { OfficialManifest, OfficialValidationFile } from "@/types/data-contract";
import { useAppState, useT } from "../AppState/use-app-state";
import { BrailleTextView } from "../BrailleTextView";
import { ProductBadges } from "../SourceBadges/ProductBadges";
import { linerNotes } from "./liner-notes";
import { TranscriptLink } from "../TranscriptLink";

const RESULT_KEYS = { pass: "official.check.pass", miss: "official.check.miss", none: "official.check.none" } as const satisfies Record<string, MessageKey>;
const BYTES_PER_MB = 1e6;

/** Everything a record states about itself, from its manifest and validation.json (nothing typed here). */
export function ProvenanceCard({ manifest, validation, part = "source" }: { manifest: OfficialManifest; validation: OfficialValidationFile | null; part?: "source" | "credits" }) {
  const { state } = useAppState();
  const t = useT();
  const ious = Object.values(manifest.georef.iou);
  const checks = validation?.checks ?? manifest.validation;
  if (part === "credits") {
    return (
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        <dt className="text-haze">{t("official.credits")}</dt>
        <dd>
          {Object.entries(manifest.credits_by_role).map(([role, people]) => (
            <p key={role}>
              <span className="text-haze">{role}: </span>
              {people.join("; ")}
            </p>
          ))}
          <p>{manifest.credit_line}</p>
        </dd>
        <dt className="text-haze">{t("official.licence")}</dt>
        <dd>{manifest.licence}</dd>
      </dl>
    );
  }
  return (
    <section className="space-y-4" aria-labelledby="official-provenance">
      <h3 id="official-provenance" className="text-lead font-medium">
        {t("official.provenance")}
      </h3>
      <ProductBadges product={manifest.record} />
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        <dt className="text-haze">{t("provenance.visualization")}</dt>
        <dd>
          {manifest.svs_ids.map((id, i) => (
            <Fragment key={id}>
              {i > 0 && ", "}
              <a href={manifest.svs_pages[i]} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                {t("official.svs", { id })}
              </a>
            </Fragment>
          ))}
          {`, ${manifest.title}`}
        </dd>
        <dt className="text-haze">{t("official.period")}</dt>
        <dd>{collapseRange(manifest.period.label)}</dd>
        <dt className="text-haze">{t("official.frameTime")}</dt>
        <dd>
          {t("official.frameTime.count", { count: manifest.frame_times.count })}
          {manifest.frame_times.approximate && ` (${t("official.approximate")})`}
        </dd>
        <dt className="text-haze">{t("official.georef")}</dt>
        <dd>
          {t("official.georef.iou", {
            iou: ious.map((v) => formatFixed(v, state.lang, 3)).join(", "),
            passAt: formatFixed(manifest.georef.pass_at, state.lang, 2),
          })}
        </dd>
        {Object.entries(manifest.voice_sources ?? {}).map(([voice, s]) => (
          <Fragment key={voice}>
            <dt className="text-haze">{t("official.voiceSource", { ...s, period: collapseRange(s.period) })}</dt>
            <dd>{s.citation.text}</dd>
          </Fragment>
        ))}
      </dl>
      <p className="text-haze">{manifest.disclosure}</p>
      <div className="space-y-1">
        <h4 className="text-haze">{t("official.checks")}</h4>
        <ul className="space-y-1">
          {checks.map((c) => (
            <li key={c.id}>
              {c.title}: {t(RESULT_KEYS[c.pass === null ? "none" : c.pass ? "pass" : "miss"])}
              {c.threshold && <span className="text-haze"> ({c.threshold})</span>}
              {c.decision && <span className="block text-haze">{c.decision.statement}</span>}
            </li>
          ))}
        </ul>
      </div>
      <details>
        <summary className="cursor-pointer text-haze">{t("official.description")}</summary>
        <p className="mt-1">{manifest.description}</p>
      </details>
      <p className="text-small text-haze">{t("official.size", { mb: manifest.size.bytes / BYTES_PER_MB })}</p>
      <BrailleTextView lines={linerNotes(t, manifest, validation)} filename={`${manifest.record}-liner-notes.txt`} />
      <TranscriptLink record={manifest.record} label={manifest.app_title} />
    </section>
  );
}
