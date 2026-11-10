"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/** One choice from a list, in a single key: so a row of places or parts takes one control's room. */
export function PickOne<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: readonly { value: T; label: string }[]; onChange: (value: T) => void }) {
  return (
    <Select
      items={options}
      value={value}
      onValueChange={(next) => {
        const chosen = options.find((o) => o.value === next);
        if (chosen) onChange(chosen.value);
      }}
    >
      <SelectTrigger aria-label={label} className="key h-11! rounded-lg bg-paper px-3 text-body text-moon">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value} className="min-h-11 text-body">
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
