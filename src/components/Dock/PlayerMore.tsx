"use client";

import { createContext, useContext, useRef, useState, type ReactNode, type RefObject } from "react";
import { DotsThree } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useT } from "../AppState/use-app-state";
import { DOCK_BUTTON } from "./dock-button";
import { setMoreSlot } from "./more-slot";

interface MoreMenu {
  close(): void;
  /** The More button: focus returns here from anything opened out of the menu. */
  button: RefObject<HTMLButtonElement | null>;
}

const MoreMenuContext = createContext<MoreMenu | null>(null);

export function useMoreMenu(): MoreMenu {
  const value = useContext(MoreMenuContext);
  if (!value) throw new Error("useMoreMenu must be used inside <PlayerMore>");
  return value;
}

/** A row in More: same size as its neighbours, whatever it does. */
export const MORE_ITEM = "h-11 w-full justify-start gap-2 rounded-lg px-3 text-body font-normal text-moon hover:bg-tide [&_svg]:size-5";

/** Everything beyond the player's main keys, so the bar stays calm. */
export function PlayerMore({ children }: { children: ReactNode }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<Button ref={button} variant="ghost" aria-label={t("player.more")} className={DOCK_BUTTON} />}>
        <DotsThree aria-hidden="true" weight="bold" />
        <span aria-hidden="true">{t("player.more")}</span>
      </PopoverTrigger>
      <PopoverContent data-tt-occluder aria-label={t("player.more")} side="top" align="end" sideOffset={12} className="surface-glass max-h-(--available-height) w-80 gap-1 overflow-y-auto rounded-plate p-2 text-body">
        <MoreMenuContext.Provider value={{ close: () => setOpen(false), button }}>
          {children}
          <div ref={setMoreSlot} className="contents" />
        </MoreMenuContext.Provider>
      </PopoverContent>
    </Popover>
  );
}
