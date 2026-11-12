"use client";

import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";

/**
 * An on/off switch: a pressed-state button with its name, its state drawn as a small switch (shape, not colour alone)
 * and, with `stateText`, written beside it ("On" / "Off"; screen readers get the pressed state).
 */
export function OnOffToggle({
  label,
  on,
  onChange,
  className,
  stateText,
  describedBy,
}: {
  label: string;
  on: boolean;
  onChange: (on: boolean) => void;
  className?: string;
  stateText?: { on: string; off: string };
  /** The id of a helper line under it. */
  describedBy?: string;
}) {
  return (
    <Toggle
      pressed={on}
      onPressedChange={onChange}
      aria-describedby={describedBy}
      className={cn("group h-11 w-full justify-between rounded-lg px-3 text-body font-normal hover:bg-tide/60 aria-pressed:bg-transparent aria-pressed:hover:bg-tide/60", className)}
    >
      {label}
      {stateText && (
        <span aria-hidden="true" className="ml-auto text-body text-moon">
          {on ? stateText.on : stateText.off}
        </span>
      )}
      <span aria-hidden="true" className={cn("relative h-5 w-9 shrink-0 rounded-full border transition-colors duration-200", on ? "border-line bg-shapla" : "border-line bg-paper")}>
        <span
          className={cn(
            "absolute top-0.75 left-0.75 size-3 rounded-full transition-[translate,background-color] duration-200 ease-out-soft",
            on ? "translate-x-4 bg-moon" : "bg-haze",
          )}
        />
      </span>
    </Toggle>
  );
}
