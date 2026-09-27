"use client";

import { Toggle } from "@/components/ui/toggle";
import { useAppState, useT } from "./AppState/use-app-state";
import { SETTING_LABELS, useCommands, type SettingKey } from "./Commands/use-commands";

/** An on/off setting: a pressed-state button with a visible "On"/"Off" mark. */
export function SettingToggle({ setting, className }: { setting: SettingKey; className?: string }) {
  const { state } = useAppState();
  const commands = useCommands();
  const t = useT();
  const on = state[setting];
  return (
    <Toggle
      pressed={on}
      onPressedChange={() => commands.toggleSetting(setting)}
      variant="outline"
      className={className ?? "h-11 w-full justify-between px-3 text-body aria-pressed:bg-tide"}
    >
      {t(SETTING_LABELS[setting])}
      <span aria-hidden="true" className="inline-flex items-center gap-1.5 text-small text-haze">
        <span className={on ? "size-2.5 rounded-full bg-moon" : "size-2.5 rounded-full border border-line"} />
      </span>
    </Toggle>
  );
}
