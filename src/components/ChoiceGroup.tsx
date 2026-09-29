"use client";

import { cn } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export interface Choice<T extends string> {
  value: T;
  label: string;
  lang?: string; // for an option written in another language (e.g. "বাংলা")
}

/**
 * Pick exactly one: a toggle group that can't be emptied. `showLabel` also
 * writes the label above it (screen readers already get it as the group name,
 * so the visible copy is hidden from them).
 */
export function ChoiceGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  className,
  itemClassName,
  showLabel = false,
  vertical = false,
}: {
  label: string;
  options: readonly Choice<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  itemClassName?: string;
  showLabel?: boolean;
  /** Stacked options that fill the width (for side cards). */
  vertical?: boolean;
}) {
  const group = (
    <ToggleGroup
      aria-label={label}
      value={[value]}
      onValueChange={(values: readonly string[]) => {
        const next = options.find((o) => o.value === values[0]);
        if (next) onChange(next.value);
      }}
      spacing={0}
      variant="outline"
      orientation={vertical ? "vertical" : "horizontal"}
      className={cn(vertical && "w-full", className)}
    >
      {options.map((o) => (
        <ToggleGroupItem
          key={o.value}
          value={o.value}
          lang={o.lang}
          className={cn("h-11 min-w-11 px-3 text-body md:pointer-fine:h-9 aria-pressed:bg-tide aria-pressed:text-moon", vertical && "h-auto min-h-11 justify-start py-2 text-left whitespace-normal md:pointer-fine:h-auto", itemClassName)}
        >
          {o.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
  if (!showLabel) return group;
  return (
    <div className="space-y-1.5">
      <p aria-hidden="true" className="text-small font-medium text-haze">
        {label}
      </p>
      {group}
    </div>
  );
}
