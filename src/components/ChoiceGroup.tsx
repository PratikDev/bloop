"use client";

import { useId } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { brailleLabel } from "@/a11y/aria";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { SPRING } from "@/lib/motion";

export interface Choice<T extends string> {
  value: T;
  label: string;
  lang?: string; // for an option written in another language (e.g. "বাংলা")
  /** A short braille form (aria-braillelabel); the label stays the accessible name. */
  brailleLabel?: string;
}

/**
 * Pick exactly one: a toggle group that can't be emptied, drawn as a pill
 * whose highlight glides to the chosen option. `showLabel` also writes the
 * label above it (screen readers already get it as the group name, so the
 * visible copy is hidden from them).
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
  const highlightId = useId();
  const group = (
    <ToggleGroup
      aria-label={label}
      value={[value]}
      onValueChange={(values: readonly string[]) => {
        const next = options.find((o) => o.value === values[0]);
        if (next) onChange(next.value);
      }}
      spacing={1}
      orientation={vertical ? "vertical" : "horizontal"}
      className={cn("max-w-full rounded-3xl border-2 border-line bg-paper p-1", vertical ? "w-full" : "flex-wrap", className)}
    >
      {options.map((o) => {
        const chosen = o.value === value;
        return (
          <ToggleGroupItem
            key={o.value}
            value={o.value}
            lang={o.lang}
            {...brailleLabel(o.brailleLabel)}
            className={cn(
              // Long names wrap inside the pill: the row never pushes the page sideways.
              "relative isolate h-auto min-h-11 max-w-full min-w-11 shrink rounded-full px-4 py-1 text-body font-normal whitespace-normal text-haze transition-colors duration-200 hover:bg-transparent hover:text-moon aria-pressed:bg-transparent aria-pressed:text-ink",
              vertical && "justify-start rounded-2xl py-2 text-left md:pointer-fine:min-h-10",
              itemClassName,
            )}
          >
            {chosen && <motion.span layoutId={highlightId} transition={SPRING.snappy} aria-hidden="true" className={cn("absolute inset-0 -z-10 bg-moon", vertical ? "rounded-2xl" : "rounded-full")} />}
            {o.label}
          </ToggleGroupItem>
        );
      })}
    </ToggleGroup>
  );
  if (!showLabel) return group;
  return (
    <div className="space-y-1.5">
      <p aria-hidden="true" className="eyebrow">
        {label}
      </p>
      {group}
    </div>
  );
}
