"use client";

import { cn } from "cn";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export interface Choice<T extends string> {
  value: T;
  label: string;
  lang?: string; // for an option written in another language (e.g. "বাংলা")
}

/** Pick exactly one: a toggle group that can't be emptied. */
export function ChoiceGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  className,
  itemClassName,
}: {
  label: string;
  options: readonly Choice<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  itemClassName?: string;
}) {
  return (
    <ToggleGroup
      aria-label={label}
      value={[value]}
      onValueChange={(values: readonly string[]) => {
        const next = options.find((o) => o.value === values[0]);
        if (next) onChange(next.value);
      }}
      spacing={0}
      variant="outline"
      className={className}
    >
      {options.map((o) => (
        <ToggleGroupItem
          key={o.value}
          value={o.value}
          lang={o.lang}
          className={cn("h-11 min-w-11 px-3 text-body md:h-9 aria-pressed:bg-tide aria-pressed:text-moon", itemClassName)}
        >
          {o.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
