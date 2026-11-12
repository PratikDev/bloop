"use client";

import { useState } from "react";
import { Disc } from "@phosphor-icons/react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useMediaQuery } from "@/hooks/use-media-query";
import { MEDIA } from "@/lib/breakpoints";
import { useT } from "../AppState/use-app-state";
import { Rack } from "../Rack";
import { DockAction } from "./DockAction";
import { MORE_ITEM } from "./PlayerMore";

/** Records in a sheet: every page but Listen from 1024 px, which has the rack beside the map. */
export function RecordsKey({ wide = false }: { wide?: boolean }) {
  const t = useT();
  const phone = useMediaQuery(MEDIA.phone);
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<DockAction icon={<Disc aria-hidden="true" />} full={t("records.label")} short={t("records.label")} className={wide ? MORE_ITEM : undefined} />} />
      <SheetContent data-tt-occluder closeLabel={t("inspector.close")} side={phone ? "bottom" : "right"} className={phone ? "max-h-[85dvh] overflow-y-auto rounded-t-sheet bg-dusk p-4 pt-14" : "w-full overflow-y-auto rounded-l-sheet bg-dusk p-4 pt-14 sm:max-w-md"}>
        <SheetTitle className="sr-only">{t("records.label")}</SheetTitle>
        <Rack onPicked={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
