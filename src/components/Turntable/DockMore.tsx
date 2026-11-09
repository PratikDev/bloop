"use client";

import { ArrowLeft, Ellipsis } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { DockAction, DockView } from "./dock-actions";
import { DockButton } from "./DockButton";
import { useTT } from "./i18n";

const WIDE_VIEWS: ReadonlySet<DockView> = new Set(["records"]);

/** The More key: a list of labelled actions; some open a view in the same popover, with a way back. */
export function DockMore({ actions, view: renderView }: { actions: readonly DockAction[]; view: (view: DockView, close: () => void) => ReactNode }) {
  const { tt } = useTT();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<DockView | null>(null);
  const change = (next: boolean) => {
    setOpen(next);
    if (!next) setView(null);
  };
  const close = () => change(false);
  return (
    <Popover open={open} onOpenChange={change}>
      <DockButton icon={Ellipsis} label={tt("turntable.more")} wrap={(b) => <PopoverTrigger render={b} />} />
      <PopoverContent side="top" aria-label={tt("turntable.more")} className={cn("tt-warm on-space gap-2 rounded-sheet p-3 text-body", "max-h-(--available-height) overflow-y-auto", view && WIDE_VIEWS.has(view) ? "popover-fit w-184" : "w-72")}>
        {view ? (
          <>
            <DockButton icon={ArrowLeft} label={tt("turntable.more.back")} autoFocus onClick={() => setView(null)} className="w-fit" />
            {renderView(view, close)}
          </>
        ) : (
          actions.map((a) => (
            <DockButton
              key={a.id}
              icon={a.icon}
              label={a.label}
              short={a.short}
              keys={a.keys}
              inlineKeys
              pressed={a.pressed}
              className="w-full justify-start"
              onClick={() => {
                if (a.view) {
                  setView(a.view);
                  return;
                }
                close();
                a.onClick?.();
              }}
            />
          ))
        )}
      </PopoverContent>
    </Popover>
  );
}
