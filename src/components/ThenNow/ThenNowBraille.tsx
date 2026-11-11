"use client";

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useMediaQuery } from "@/hooks/use-media-query";
import { MEDIA } from "@/lib/breakpoints";
import { cn } from "@/lib/utils";
import { useT } from "../AppState/use-app-state";
import { BrailleExplorer } from "../BrailleExplorer";
import { takeBrailleOpener } from "../BrailleExplorer/opener";
import { useThenNowBrailleSource, type ThenNowBrailleInput } from "./use-then-now-braille-source";

/**
 * Then vs Now's Braille Data Explorer (plan item 11), over the page so the part keeps its one screen: a sheet from the
 * right, full-screen on phones (as Listen's). B on the page or its row in the player's More opens it; closing gives
 * focus back to where it was opened from (More's key for its row, which goes away with the menu).
 */
export function ThenNowBraille({ input, open, onOpenChange }: { input: ThenNowBrailleInput; open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useT();
  const phone = useMediaQuery(MEDIA.phone);
  const source = useThenNowBrailleSource(input);
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        showCloseButton={false}
        side={phone ? "bottom" : "right"}
        finalFocus={() => takeBrailleOpener() ?? true}
        className={cn("overflow-y-auto p-0", phone ? "h-dvh max-h-dvh rounded-none data-[side=bottom]:top-0 data-[side=bottom]:h-dvh" : "w-full rounded-l-sheet data-[side=right]:sm:max-w-lg")}
      >
        <SheetTitle className="sr-only">{t("braille.heading")}</SheetTitle>
        {source && <BrailleExplorer key={source.key} source={source} onClose={() => onOpenChange(false)} className="border-0 shadow-none" />}
      </SheetContent>
    </Sheet>
  );
}
