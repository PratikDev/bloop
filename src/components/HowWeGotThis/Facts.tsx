"use client";

import { Fragment, type ReactNode } from "react";
import type { BoundT, MessageKey } from "@/lib/i18n";
import type { Provenance, ProvenanceLink, ProvenanceStatus } from "@/lib/provenance/types";
// >>> DATA
import { DataFacts } from "../EarthData/DataFacts";
// <<< DATA

const STATUS_KEYS = {
  verified: "hwgt.status.verified",
  "values with stated error": "hwgt.status.stated",
  relative: "hwgt.status.relative",
  "pattern only": "hwgt.status.pattern",
  "visual texture": "hwgt.status.texture",
  "insufficient data": "hwgt.status.insufficient",
  observation: "hwgt.status.observation",
  "no check": "hwgt.status.noCheck",
  file: "hwgt.status.file",
} as const satisfies Record<ProvenanceStatus, MessageKey>;

const Link = ({ link }: { link: ProvenanceLink }) => (
  <a href={link.href} target="_blank" rel="noreferrer" className="break-all underline underline-offset-2">
    {link.label}
  </a>
);

/** One group's facts as a definition list; a missing field says "not available", never a guess. */
export function Facts({ t, facts }: { t: BoundT; facts: Provenance }) {
  const na = <span className="text-haze">{t("hwgt.na")}</span>;
  const text = (v: string | null): ReactNode => (v === null ? na : v);
  const rows: [MessageKey, ReactNode][] = [
    ["hwgt.field.dataset", facts.dataset === null ? na : <span lang="en">{facts.dataset}</span>],
    ["hwgt.field.version", facts.version === null ? na : <span lang="en">{facts.version}</span>],
    ["hwgt.field.link", facts.link === null ? na : <Link link={{ label: facts.link, href: facts.link }} />],
    ["hwgt.field.window", text(facts.window)],
    ["hwgt.field.cell", text(facts.cell)],
    ["hwgt.field.place", text(facts.place)],
    ["hwgt.field.method", text(facts.method)],
    ["hwgt.field.uncertainty", text(facts.uncertainty)],
    ["hwgt.field.n", text(facts.n)],
    ["hwgt.field.status", facts.status === null ? na : t(STATUS_KEYS[facts.status])],
    [
      "hwgt.field.scripts",
      facts.scripts.length ? (
        <span className="flex flex-col">
          {facts.scripts.map((s) => (
            <Link key={s.href} link={s} />
          ))}
        </span>
      ) : (
        na
      ),
    ],
    ["hwgt.field.validation", facts.validation === null ? na : <Link link={facts.validation} />],
  ];
  return (
    <>
      {facts.patternOnly && <p className="text-body text-moon">{facts.patternOnly}</p>}
      <dl className="grid grid-cols-[minmax(7rem,auto)_1fr] gap-x-3 gap-y-1.5 text-body">
        {rows.map(([key, value]) => (
          <Fragment key={key}>
            <dt className="text-haze">{t(key)}</dt>
            <dd data-field={key.replace("hwgt.field.", "")}>{value}</dd>
          </Fragment>
        ))}
      </dl>
      {/* >>> DATA: "Is this data fresh?" and a live frame's acceptance check */}
      <DataFacts facts={facts} />
      {/* <<< DATA */}
    </>
  );
}
