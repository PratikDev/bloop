"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useMediaQuery } from "@/hooks/use-media-query";
import { MEDIA } from "@/lib/breakpoints";
import { useT } from "./AppState/use-app-state";
import { InlineDisclosure } from "./InlinePanel/Disclosure";
import { useInlinePanels } from "./LowVision/use-inline-panels";

/**
 * Full text one click away, so pages never grow: a side sheet (a bottom sheet
 * on phones), opened by a ghost button showing `trigger` (styled by `triggerClassName`); in low-vision mode, in the page.
 */
export function InfoSheet({
  trigger,
  triggerClassName,
  triggerLabel,
  title,
  children,
}: {
  trigger: ReactNode;
  triggerClassName?: string;
  /** A fuller name when the visible text repeats on the page (it must contain that text). */
  triggerLabel?: string;
  title: string;
  children: ReactNode;
}) {
  const phone = useMediaQuery(MEDIA.phone);
  const t = useT();
  // Low-vision mode: in the page, right after the button (spec 4.5: no full-screen pop-ups).
  const inline = useInlinePanels();
  if (inline) {
    return (
      <InlineDisclosure trigger={trigger} triggerLabel={triggerLabel} triggerClassName={triggerClassName} title={title}>
        <div className="space-y-4 text-body">{children}</div>
      </InlineDisclosure>
    );
  }
  return (
    <Sheet>
      <SheetTrigger render={<Button variant="ghost" aria-label={triggerLabel} className={triggerClassName} />}>{trigger}</SheetTrigger>
      <SheetContent
        closeLabel={t("inspector.close")}
        side={phone ? "bottom" : "right"}
        className={phone ? "max-h-[85dvh] overflow-y-auto rounded-t-sheet bg-dusk p-5 pt-6" : "w-full overflow-y-auto rounded-l-sheet bg-dusk p-6 sm:max-w-xl"}
      >
        <SheetTitle className="pr-12 font-wide text-title">{title}</SheetTitle>
        <div className="space-y-4 text-body">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
