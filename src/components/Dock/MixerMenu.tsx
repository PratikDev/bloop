"use client";

import { SlidersHorizontal } from "@phosphor-icons/react";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { useAppState, useT } from "../AppState/use-app-state";
import { Mixer } from "../Mixer";
import { SettingToggle } from "../SettingToggle";
import { DockAction } from "./DockAction";

/** Volume, mute and solo per voice, and Mute all (M), in a popover above the dock. */
export function MixerMenu() {
  const { state } = useAppState();
  const t = useT();
  // Something is silenced on purpose: say so on the button, so silence is never a mystery.
  const limited = state.allMuted || state.solo !== null || Object.values(state.mix).some((m) => m.muted || m.volume === 0);
  return (
    <Popover>
      <PopoverTrigger
        render={
          <DockAction
            icon={
              <span className="relative">
                <SlidersHorizontal aria-hidden="true" />
                {limited && <span aria-hidden="true" className="absolute -top-0.5 -right-1 size-2 rounded-full bg-shapla ring-2 ring-dusk" />}
              </span>
            }
            full={limited ? t("mixer.limited") : t("mixer.label")}
            short={t("dock.short.mixer")}
          />
        }
      />
      <PopoverContent side="top" align="end" sideOffset={12} className="surface-glass w-[min(22rem,calc(100vw-1.5rem))] gap-3 rounded-plate p-4 text-body">
        <PopoverTitle className="eyebrow">{t("mixer.label")}</PopoverTitle>
        <Mixer />
        <div className="stitch-x opacity-60" aria-hidden="true" />
        <SettingToggle setting="allMuted" />
      </PopoverContent>
    </Popover>
  );
}
