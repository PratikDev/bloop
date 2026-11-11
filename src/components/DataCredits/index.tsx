"use client";

import { formatInteger, type BoundT, type MessageKey } from "@/lib/i18n";
import { CREDIT_GROUPS, type CreditEntry, type CreditGroup, type CreditPage } from "@/lib/credits/types";
import { cn } from "@/lib/utils";
import { useAppState, useT } from "../AppState/use-app-state";
import { StatusBadge } from "../StatusBadge";
import { useCredits } from "./use-credits";

const PAGE_KEYS = {
  listen: "nav.listen",
  thenNow: "nav.thenNow",
  how: "nav.how",
  official: "nav.official",
  turntable: "nav.turntable",
  braille: "credits.page.braille",
} as const satisfies Record<CreditPage, MessageKey>;

const GROUP_KEYS = {
  observations: "credits.group.observations",
  models: "credits.group.models",
  svs: "credits.group.svs",
} as const satisfies Record<CreditGroup, MessageKey>;

const FOLDED: ReadonlySet<CreditGroup> = new Set(["svs"]);

type Level = 2 | 3;
const Heading = ({ level, className, children }: { level: Level | 4; className?: string; children: string }) => {
  const Tag = `h${level}` as const;
  return <Tag className={className}>{children}</Tag>;
};

function Entry({ t, entry }: { t: BoundT; entry: CreditEntry }) {
  return (
    <li data-credit-id={entry.id}>
      {entry.link ? (
        <a lang="en" href={entry.link} target="_blank" rel="noreferrer" aria-label={t("credits.link", { name: entry.name })} className="underline underline-offset-2">
          {entry.name}
        </a>
      ) : (
        <span lang="en">
          {entry.name} <span className="text-haze">({t("credits.noLink")})</span>
        </span>
      )}
      <span lang="en" className="text-haze"> · {entry.provider}</span>
      {entry.pages.length > 0 && (
        <span className="block text-small text-haze">{t("credits.plays", { pages: entry.pages.map((p) => t(PAGE_KEYS[p])).join(", ") })}</span>
      )}
    </li>
  );
}

const List = ({ t, entries }: { t: BoundT; entries: CreditEntry[] }) => (
  <ul className="space-y-1.5">
    {entries.map((e) => (
      <Entry key={e.id} t={t} entry={e} />
    ))}
  </ul>
);

export function DataCredits({ level = 3, className }: { level?: Level; className?: string }) {
  const t = useT();
  const { state } = useAppState();
  const { value: credits, error } = useCredits();
  if (error) return <StatusBadge kind="error">{t("credits.error")}</StatusBadge>;
  if (!credits) return <StatusBadge kind="loading">{t("credits.loading")}</StatusBadge>;
  const sub = (level + 1) as 3 | 4;
  return (
    <div data-testid="data-credits" className={cn("space-y-5 text-body", className)}>
      <section data-credits="data" className="space-y-3">
        <Heading level={level} className="text-lead font-medium text-moon">{t("credits.heading.data")}</Heading>
        {CREDIT_GROUPS.map((g) => {
          const entries = credits.data[g];
          if (!entries.length) return null;
          const title = t(GROUP_KEYS[g]);
          const count = t("credits.group.count", { count: formatInteger(entries.length, state.lang) });
          return (
            <section key={g} data-credit-group={g} className="space-y-1.5">
              {FOLDED.has(g) ? (
                <details>
                  <summary className="cursor-pointer font-medium text-moon">{`${title}: ${count}`}</summary>
                  <div className="mt-2">
                    <List t={t} entries={entries} />
                  </div>
                </details>
              ) : (
                <>
                  <Heading level={sub} className="font-medium text-moon">{title}</Heading>
                  <List t={t} entries={entries} />
                </>
              )}
            </section>
          );
        })}
      </section>
      <section data-credits="testing" className="space-y-1.5">
        <Heading level={level} className="text-lead font-medium text-moon">{t("credits.heading.testing")}</Heading>
        <p className="text-small text-haze">{t("credits.testing.note")}</p>
        <List t={t} entries={credits.testing} />
        <p className="text-small text-haze">{t("credits.power")}</p>
      </section>
    </div>
  );
}
