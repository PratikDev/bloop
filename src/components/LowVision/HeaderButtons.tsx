"use client";

import { Eye, SlidersHorizontal } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useT } from "../AppState/use-app-state";
import { useLowVisionPreset } from "./use-low-vision-preset";

export const LV_PANEL_ID = "lv-settings";

export function LowVisionButtons({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useT();
  return (
    <div className="flex items-center gap-1">
      <LowVisionToggle />
      <Button
        variant="ghost"
        size="icon-lg"
        aria-expanded={open}
        aria-controls={LV_PANEL_ID}
        aria-label={t("lv.settings")}
        onClick={() => onOpenChange(!open)}
        className="size-11 text-haze hover:text-moon"
      >
        <SlidersHorizontal aria-hidden="true" className="size-5" />
      </Button>
    </div>
  );
}

export function LowVisionToggle({ label = "lv.toggle", className }: { label?: "lv.toggle" | "lv.tuningToggle"; className?: string }) {
  const t = useT();
  const { on, toggle } = useLowVisionPreset();
  return (
    <Button
      variant="ghost"
      aria-pressed={on}
      aria-keyshortcuts="Alt+L"
      onClick={toggle}
      className={cn("h-11 gap-1.5 rounded-full px-3 text-small", on ? "bg-tide text-moon ring-2 ring-shapla" : "text-haze hover:text-moon", className)}
    >
      <Eye aria-hidden="true" className="size-5" />
      {t(label)}
    </Button>
  );
}
