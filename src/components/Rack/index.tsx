"use client";

import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { CaretDown } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { RECORD_GROUPS, type JukeboxRecord, type RecordGroup } from "@/lib/records";
import { cn } from "@/lib/utils";
import { PAGE_PATHS } from "@/router/modes";
import { useT } from "../AppState/use-app-state";
import { useRecords } from "../Records/use-records";
import { useTimeLapse } from "../TimeLapse/use-time-lapse";
import { FirstHint } from "../pages/Listen/FirstHint";
import { CodeEntry } from "./CodeEntry";
import { RecordStrip } from "./RecordStrip";

/** Group C is long: the rack shows the first few and links to the page that lists them all. */
const OFFICIAL_SHOWN = 3;

/** The rack: code entry, then one group open at a time (the current record's, until another is opened). */
export function Rack({ className, onPicked }: { className?: string; onPicked?: () => void }) {
  const { records, current, legendPlayed, play } = useRecords();
  const timeLapse = useTimeLapse();
  const t = useT();
  const auto: RecordGroup = current?.group ?? "A";
  const [choice, setChoice] = useState<{ open: RecordGroup | null; forGroup: RecordGroup } | null>(null);
  const open = choice && choice.forGroup === auto ? choice.open : auto;

  const pick = (record: JukeboxRecord) => {
    play(record);
    onPicked?.();
  };
  const loadingText = (record: JukeboxRecord) => {
    const { progress } = timeLapse;
    if (record.action.kind !== "timeLapse" || timeLapse.status !== "loading" || !progress?.total) return undefined;
    return t("timelapse.loadingShort", { percent: Math.round((progress.loaded / progress.total) * 100) });
  };

  return (
    <div className={cn("space-y-4", className)}>
      <h2 className="font-wide text-title">{t("records.heading")}</h2>
      <FirstHint />
      <CodeEntry onPlayed={onPicked} />
      {RECORD_GROUPS.map((group) => {
        const all = records.filter((r) => r.group === group);
        if (all.length === 0) return null;
        const isOpen = open === group;
        const panelId = `rack-${group}`;
        const shown = group === "C" ? all.filter((r, i) => i < OFFICIAL_SHOWN || r === current) : all;
        return (
          <section key={group} className="space-y-2">
            <h3>
              <Button
                variant="ghost"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setChoice({ open: isOpen ? null : group, forGroup: auto })}
                className="h-11 w-full justify-start gap-3 rounded-lg px-1 text-left text-body font-normal text-moon hover:bg-tide/60 aria-expanded:bg-transparent"
              >
                <span aria-hidden="true" translate="no" className="font-wide text-lead">
                  {group}
                </span>
                <span className="flex-1">{t(`records.group.${group}`)}</span>
                <span className="text-small text-haze tabular-nums">{t("records.count", { count: all.length })}</span>
                <CaretDown aria-hidden="true" className={cn("size-4", isOpen && "rotate-180")} />
              </Button>
            </h3>
            {isOpen && (
              <ul id={panelId} className="space-y-2.5 pr-1 pb-1">
                {shown.map((record) => (
                  <li key={record.code}>
                    <RecordStrip
                      record={record}
                      chosen={record === current}
                      length={loadingText(record)}
                      onClick={() => pick(record)}
                      tag={
                        record.action.kind === "legend" && !legendPlayed ? (
                          <span className="mt-0.5 inline-block rounded-full border-2 border-navy bg-paper px-2 text-small text-moon">{t("records.startHere")}</span>
                        ) : undefined
                      }
                    />
                  </li>
                ))}
                {group === "C" && (
                  <li>
                    <Link to={PAGE_PATHS.official} onClick={onPicked} className="key border-navy flex min-h-11 items-center rounded-lg bg-paper px-3 text-body text-moon">
                      {t("records.allOfficial")}
                    </Link>
                  </li>
                )}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
