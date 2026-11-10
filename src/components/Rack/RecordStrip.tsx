"use client";

import type { ReactNode } from "react";
import { brailleLabel } from "@/a11y/aria";
import { Button } from "@/components/ui/button";
import type { JukeboxRecord } from "@/lib/records";
import { cn } from "@/lib/utils";
import { useT } from "../AppState/use-app-state";
import { Equaliser } from "../Equaliser";

/** A record's code chip: navy on the crown, paper in the rack, coral when chosen. */
export function CodeChip({ code, chosen = false, className }: { code: string; chosen?: boolean; className?: string }) {
  return (
    <span translate="no" className={cn("grid h-10.5 w-11.5 shrink-0 place-items-center rounded-md border-2 border-navy font-strip text-strip tabular-nums", chosen ? "bg-shapla text-moon" : "bg-paper text-moon", className)}>
      {code}
    </span>
  );
}

/** A title strip: a real button whose name starts with the code; chosen is shown by aria-pressed, a thicker border and the equaliser. */
export function RecordStrip({
  record,
  chosen,
  length,
  tag,
  braille,
  onClick,
}: {
  record: JukeboxRecord;
  chosen: boolean;
  /** Overrides the record's own length (the time-lapse's loading percentage). */
  length?: string;
  tag?: ReactNode;
  /** A short braille form of the name. */
  braille?: string;
  onClick: () => void;
}) {
  const t = useT();
  const title = record.title(t);
  const subtitle = record.subtitle?.(t);
  const shownLength = length ?? record.length?.(t);
  return (
    <Button
      variant="ghost"
      aria-pressed={chosen}
      aria-label={[`${record.code}, ${title}`, subtitle, shownLength].filter(Boolean).join(". ")}
      onClick={onClick}
      {...(braille ? brailleLabel(braille) : {})}
      className="key border-navy h-auto min-h-14 w-full justify-start gap-3 rounded-lg bg-paper px-2 py-1.5 text-left font-normal whitespace-normal text-moon hover:bg-paper aria-pressed:border-[3.5px] aria-pressed:bg-paper"
    >
      <CodeChip code={record.code} chosen={chosen} />
      <span className="min-w-0 flex-1">
        <span className="block font-strip text-strip leading-tight">{title}</span>
        {subtitle && <span className="block text-small text-haze">{subtitle}</span>}
        {tag}
      </span>
      {shownLength && <span className="shrink-0 text-small text-haze tabular-nums">{shownLength}</span>}
      {chosen && <Equaliser className="shrink-0" />}
    </Button>
  );
}
