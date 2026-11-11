"use client";

import { useId, useState } from "react";
import { ArrowsLeftRight } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BEATS, COMPARE_LAYERS } from "@/lib/compare";
import { formatMonthName, formatYear } from "@/lib/i18n";
import { useAppState, useT } from "../../AppState/use-app-state";
import { ChoiceGroup } from "../../ChoiceGroup";
import { StatusBadge } from "../../StatusBadge";
import { DockAction } from "../DockAction";
import { LAYER_LABEL, useCompare } from "./use-compare";

const MONTHS = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"] as const;

function Pick({ label, value, options, onChange }: { label: string; value: string; options: { value: string; label: string }[]; onChange(v: string): void }) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <p id={id} className="text-small text-haze">
        {label}
      </p>
      <Select value={value} onValueChange={(v: string | null) => v && onChange(v)}>
        <SelectTrigger aria-labelledby={id} className="h-11 w-full border-line px-3 text-body pointer-fine:h-9">
          <SelectValue>{options.find((o) => o.value === value)?.label}</SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-dusk text-moon">
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value} className="text-body">
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function CompareMenu() {
  const { state } = useAppState();
  const t = useT();
  const [open, setOpen] = useState(false);
  const c = useCompare(open);
  const lang = state.lang;
  const month = c.months?.b.slice(5) ?? "01";
  const yearOptions = c.years.map((y) => ({ value: String(y), label: formatYear(y, lang) }));
  const setYearMonth = (side: "a" | "b", year: string, mm: string) =>
    c.months && c.setMonths({ ...c.months, [side]: `${year}-${mm}` });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<DockAction icon={<ArrowsLeftRight aria-hidden="true" />} full={t("compare.open")} label={t("compare.short")} short={t("compare.short")} />} />
      <PopoverContent side="top" align="start" sideOffset={12} data-testid="compare-menu" className="surface-glass w-[min(24rem,calc(100vw-1.5rem))] gap-3 rounded-plate p-4 text-body">
        <PopoverTitle className="eyebrow">{t("compare.title")}</PopoverTitle>
        <ChoiceGroup
          showLabel
          label={t("compare.layer")}
          className="w-full"
          itemClassName="flex-1 px-2"
          options={COMPARE_LAYERS.map((value) => ({ value, label: t(LAYER_LABEL[value]) }))}
          value={c.name}
          onChange={c.setName}
        />
        {c.layer.status === "loading" && <p className="text-haze">{t("compare.loading")}</p>}
        {c.layer.status === "error" && <StatusBadge kind="error">{t("compare.error")}</StatusBadge>}
        {c.layer.status === "ready" && c.months && (
          <>
            <Pick
              label={t("compare.month")}
              value={month}
              options={MONTHS.map((mm) => ({ value: mm, label: formatMonthName(mm, lang) }))}
              onChange={(mm) => c.months && c.setMonths({ a: `${c.months.a.slice(0, 4)}-${mm}`, b: `${c.months.b.slice(0, 4)}-${mm}` })}
            />
            <div className="grid grid-cols-2 gap-3">
              <Pick label={t("compare.yearA")} value={c.months.a.slice(0, 4)} options={yearOptions} onChange={(y) => setYearMonth("a", y, month)} />
              <Pick label={t("compare.yearB")} value={c.months.b.slice(0, 4)} options={yearOptions} onChange={(y) => setYearMonth("b", y, month)} />
            </div>
            <p className="text-small text-haze">{t(BEATS[c.name] ? "compare.howBeats" : "compare.howDrops")}</p>
            <Button onClick={c.run} className="h-11 w-full gap-2 rounded-full bg-shapla text-body text-ink hover:bg-shapla/90 pointer-fine:h-9">
              {t("compare.play")}
            </Button>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
