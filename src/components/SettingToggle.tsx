"use client";

import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";
import { useAppState, useT } from "./AppState/use-app-state";
import { SETTING_LABELS, useCommands, type SettingKey } from "./Commands/use-commands";

/** An on/off setting: a pressed-state button, its state drawn as a small switch (shape, not colour alone). */
export function SettingToggle({ setting, className }: { setting: SettingKey; className?: string }) {
  const { state } = useAppState();
  const commands = useCommands();
  const t = useT();
  const on = state[setting];
  return (
    <Toggle
      pressed={on}
      onPressedChange={() => commands.toggleSetting(setting)}
      className={cn("group h-11 w-full justify-between rounded-lg px-3 text-body font-normal hover:bg-tide/60 aria-pressed:bg-transparent aria-pressed:hover:bg-tide/60", className)}
    >
      {t(SETTING_LABELS[setting])}
      <span aria-hidden="true" className={cn("relative h-5 w-9 shrink-0 rounded-full border transition-colors duration-200", on ? "border-shapla bg-shapla/25" : "border-line")}>
        <span
          className={cn(
            "absolute top-0.75 left-0.75 size-3 rounded-full transition-[translate,background-color] duration-200 ease-out-soft",
            on ? "translate-x-4 bg-shapla" : "bg-haze",
          )}
        />
      </span>
    </Toggle>
  );
}
