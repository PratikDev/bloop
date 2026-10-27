"use client";

import { Toggle } from "@/components/ui/toggle";

/** An on/off switch: a pressed-state button with its name and a visible on/off mark. */
export function OnOffToggle({ label, on, onChange, className }: { label: string; on: boolean; onChange: (on: boolean) => void; className?: string }) {
  return (
    <Toggle
      pressed={on}
      onPressedChange={onChange}
      variant="outline"
      className={className ?? "h-11 w-full justify-between px-3 text-body aria-pressed:bg-tide"}
    >
      {label}
      <span aria-hidden="true" className="inline-flex items-center gap-1.5 text-small text-haze">
        <span className={on ? "size-2.5 rounded-full bg-moon" : "size-2.5 rounded-full border border-line"} />
      </span>
    </Toggle>
  );
}
