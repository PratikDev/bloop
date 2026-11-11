"use client";

import { Eye, SlidersHorizontal } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useT } from "../AppState/use-app-state";
import { HEADER_KEY } from "../Header/header-key";
import { useLowVisionPreset } from "./use-low-vision-preset";

export const LV_PANEL_ID = "lv-settings";

/**
 * The low-vision switch and its settings, at the top left where magnifier users look first (TetraLogical; spec 4.5).
 * The switch turns the preset on or off (also Alt+L); the settings open inline under the header, never full screen.
 */
export function LowVisionButtons({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useT();
  return (
    <div className="flex items-center gap-2">
      <LowVisionToggle />
      <Button
        variant="ghost"
        size="icon-lg"
        aria-expanded={open}
        aria-controls={LV_PANEL_ID}
        aria-label={t("lv.settings")}
        onClick={() => onOpenChange(!open)}
        className={HEADER_KEY}
      >
        <SlidersHorizontal aria-hidden="true" className="size-5" />
      </Button>
    </div>
  );
}

/** The low-vision preset's switch ("Low vision", pressed when on): in the header and in Track 0 (spec 4.7). */
export function LowVisionToggle({ label = "lv.toggle", className }: { label?: "lv.toggle" | "lv.tuningToggle"; className?: string }) {
  const t = useT();
  const { on, toggle } = useLowVisionPreset();
  return (
    <Button
      variant="ghost"
      aria-pressed={on}
      aria-keyshortcuts="Alt+L"
      onClick={toggle}
      className={cn("key border-navy h-11 gap-1.5 rounded-lg bg-paper px-3 text-small text-moon hover:bg-paper aria-pressed:bg-shapla aria-pressed:hover:bg-shapla", className)}
    >
      <Eye aria-hidden="true" className="size-5" />
      {t(label)}
    </Button>
  );
}
