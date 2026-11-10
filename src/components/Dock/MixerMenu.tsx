"use client";

import { SlidersHorizontal } from "@phosphor-icons/react";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { useAppState, useT } from "../AppState/use-app-state";
import { Mixer } from "../Mixer";
import { SettingToggle } from "../SettingToggle";
import { DockAction } from "./DockAction";

/** Something is silenced on purpose: the button says so, so silence is never a mystery. */
export function useMixerLimited(): boolean {
  const { state } = useAppState();
  return state.allMuted || state.solo !== null || Object.values(state.mix).some((m) => m.muted || m.volume === 0);
}

/** The mixer's popover: volume, mute and solo per voice, and Mute all (M). */
export function MixerContent() {
  const t = useT();
  return (
    <PopoverContent data-tt-occluder side="top" align="end" sideOffset={12} className="surface-glass w-[min(22rem,calc(100vw-1.5rem))] gap-3 rounded-plate p-4 text-body">
      <PopoverTitle className="eyebrow">{t("mixer.label")}</PopoverTitle>
      <MixerPanel />
    </PopoverContent>
  );
}

/** Volume, mute and solo per voice, and Mute all: in the mixer's popover, or inside another menu. */
export function MixerPanel() {
  return (
    <div className="space-y-3">
      <Mixer />
      <div className="stitch-x opacity-60" aria-hidden="true" />
      <SettingToggle setting="allMuted" />
    </div>
  );
}

/** The mixer's key in the dock. */
export function MixerMenu() {
  const t = useT();
  const limited = useMixerLimited();
  return (
    <Popover>
      <PopoverTrigger
        render={
          <DockAction
            icon={
              <span className="relative">
                <SlidersHorizontal aria-hidden="true" />
                {limited && <span aria-hidden="true" className="absolute -top-0.5 -right-1 size-2 rounded-full bg-shapla ring-2 ring-moon" />}
              </span>
            }
            full={limited ? t("mixer.limited") : t("mixer.label")}
            short={t("dock.short.mixer")}
            className="bg-moon text-ink hover:bg-moon hover:text-ink aria-expanded:bg-moon aria-expanded:text-ink"
          />
        }
      />
      <MixerContent />
    </Popover>
  );
}
