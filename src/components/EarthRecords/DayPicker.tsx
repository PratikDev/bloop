"use client";

import { useId } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDay } from "@/lib/i18n";
import { useAppState } from "../AppState/use-app-state";

/** One labelled list of days (a shadcn Select; its visible label names it for every screen reader). */
export function DayPicker({ label, days, value, onChange }: { label: string; days: readonly string[]; value: string; onChange(day: string): void }) {
  const id = useId();
  const { state } = useAppState();
  return (
    <div className="space-y-1.5">
      <p id={id} className="text-small text-haze">
        {label}
      </p>
      <Select value={value} onValueChange={(v: string | null) => v && onChange(v)}>
        <SelectTrigger aria-labelledby={id} className="h-11 w-full border-line px-3 text-body pointer-fine:h-9" data-testid="day-picker">
          <SelectValue>{formatDay(value, state.lang)}</SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-dusk text-moon">
          {days.map((d) => (
            <SelectItem key={d} value={d} className="text-body">
              {formatDay(d, state.lang)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
