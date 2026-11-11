"use client";

import { useRef, type ReactNode } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useMediaQuery } from "@/hooks/use-media-query";
import { MEDIA } from "@/lib/breakpoints";
import { cn } from "@/lib/utils";
import { useT } from "./AppState/use-app-state";

/**
 * A sheet opened from somewhere else (a menu item, a key): from the right on wide screens, from the bottom on phones.
 * It opens on its title; closing gives focus back to `opener`.
 */
export function SideSheet({
  open,
  onClose,
  title,
  opener,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  /** The control focus returns to (the default is the one that had it). */
  opener: () => HTMLElement | null;
  children: ReactNode;
}) {
  const t = useT();
  const phone = useMediaQuery(MEDIA.phone);
  const heading = useRef<HTMLHeadingElement>(null);
  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent
        data-tt-occluder
        closeLabel={t("inspector.close")}
        side={phone ? "bottom" : "right"}
        initialFocus={heading}
        finalFocus={() => opener() ?? true}
        className={cn("overflow-y-auto p-5 text-body", phone ? "max-h-[85dvh] rounded-t-sheet" : "w-full rounded-l-sheet sm:max-w-lg")}
      >
        <SheetTitle ref={heading} tabIndex={-1} className="eyebrow outline-none">
          {title}
        </SheetTitle>
        {children}
      </SheetContent>
    </Sheet>
  );
}
