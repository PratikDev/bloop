"use client";

import { useAppState, useT } from "./AppState/use-app-state";
import { SETTING_LABELS, useCommands, type SettingKey } from "./Commands/use-commands";
import { OnOffToggle } from "./OnOffToggle";

/** An on/off app setting. */
export function SettingToggle({ setting, className }: { setting: SettingKey; className?: string }) {
  const { state } = useAppState();
  const commands = useCommands();
  const t = useT();
  return <OnOffToggle label={t(SETTING_LABELS[setting])} on={state[setting]} onChange={() => commands.toggleSetting(setting)} className={className} />;
}
