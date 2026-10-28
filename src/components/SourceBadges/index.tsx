"use client";

import { Badge } from "@/components/ui/badge";
import { ageDaysAt, isModel, livenessAt } from "@/lib/data";
import { formatMonth, type ArgsOf, type Lang } from "@/lib/i18n";
import type { badgesEn } from "@/lib/i18n/en/badges";
import { cn } from "@/lib/utils";
import type { Agency, FreshnessEntry } from "@/types/data-contract";

export type BadgeKey = keyof typeof badgesEn;
/** The app's t() or the Turntable's tt(): both read these keys (tt adds Bangla drafts). */
export type BadgeT = <K extends BadgeKey>(key: K, ...args: ArgsOf<K>) => string;

const AGENCY_KEYS: Partial<Record<Agency, BadgeKey>> = { ground: "badge.agency.ground", other: "badge.agency.other" };
const HOUR_DAYS = 1 / 24;

/** "Latest available: 5 h old" / "1.6 days old"; the recorded line past the limit; a record's period for baselines. */
export function ageText(entry: FreshnessEntry, now: number, tr: BadgeT, lang: Lang): string {
  const live = livenessAt(entry, now);
  if (live === "missing") return tr("badge.missing");
  if (live === "baseline") {
    const [from, to] = entry.period ?? [null, null];
    const month = (s: string | null) => (s ? formatMonth(s.slice(0, 7), lang) : "—");
    return tr("badge.baseline", { from: month(from), to: month(to) });
  }
  const days = ageDaysAt(entry, now) ?? 0;
  const age = days < 1 ? tr("badge.hours", { n: Math.max(1, Math.round(days / HOUR_DAYS)) }) : tr("badge.days", { n: days });
  return live === "live" ? tr("badge.latest", { age }) : tr("badge.recorded", { age });
}

/** Shared inputs across agencies in one product (a duet): "partly independent" (book §4.6). */
function sharesAcrossAgencies(entry: FreshnessEntry): boolean {
  return entry.datasets.some((a) => a.shares_inputs_with.some((id) => entry.datasets.some((b) => b.id === id && b.agency !== a.agency)));
}

/**
 * Agency, measurement or model, frame-paired or context, and the data age, for one product
 * (meta/freshness.json). Shape and words carry the status, never colour: a model is dashed.
 */
export function SourceBadges({ entry, now, tr, lang, className }: { entry: FreshnessEntry | undefined; now: number; tr: BadgeT; lang: Lang; className?: string }) {
  if (!entry) return null;
  const agencies = [...new Set(entry.datasets.map((d) => d.agency))];
  const model = isModel(entry);
  const recorded = livenessAt(entry, now) === "recorded";
  return (
    <span className={cn("flex flex-wrap items-center gap-1", className)} aria-label={tr("badge.sources")}>
      {agencies.map((a) => (
        <Badge key={a} variant="outline" className="text-moon">
          {AGENCY_KEYS[a] ? tr(AGENCY_KEYS[a]) : a}
        </Badge>
      ))}
      <Badge variant="outline" className={cn("text-moon", model && "border-dashed")}>
        {tr(model ? "badge.model" : "badge.measurement")}
      </Badge>
      <Badge variant="outline" className="text-moon">
        {tr(entry.pairing === "frame-paired" ? "badge.framePaired" : "badge.context")}
      </Badge>
      {sharesAcrossAgencies(entry) && (
        <Badge variant="outline" className="text-moon">
          {tr("badge.partly")}
        </Badge>
      )}
      <Badge variant="outline" className={cn("text-haze", recorded && "border-dotted text-moon")}>
        {ageText(entry, now, tr, lang)}
      </Badge>
    </span>
  );
}
