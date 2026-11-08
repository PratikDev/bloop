"use client";

import { GearSix } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { FLAGS } from "@/lib/flags";
import { AccessSettings } from "../AccessSettings";
import { useT } from "../AppState/use-app-state";
import { SettingToggle } from "../SettingToggle";

/** Describe, Captions, Speech (or Built-in voice), Detail, Each step and Reduce motion, one click from anywhere. */
export function SettingsMenu() {
  const t = useT();
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="ghost" size="icon-lg" aria-label={t("settings.open")} className="size-11 text-haze hover:text-moon" />}>
        <GearSix aria-hidden="true" className="size-5" />
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="surface-glass w-80 gap-2 rounded-plate p-3 text-body">
        <PopoverTitle className="eyebrow px-1 pb-1">{t("settings.open")}</PopoverTitle>
        <SettingToggle setting="describe" />
        <SettingToggle setting="captions" />
        {/* With the accessibility core on, the three-way Speech choice replaces the Built-in voice switch. */}
        {FLAGS.speechChoices ? (
          <AccessSettings />
        ) : (
          <>
            <SettingToggle setting="builtInVoice" />
            <p className="px-1 text-small text-haze">{t("help.voiceNote")}</p>
          </>
        )}
        <SettingToggle setting="reduceMotion" />
        {FLAGS.mapKeys && <SettingToggle setting="hide3d" />}
      </PopoverContent>
    </Popover>
  );
}
