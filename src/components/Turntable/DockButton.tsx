"use client";

import { Minus, Plus, type LucideIcon } from "lucide-react";
import type { ReactElement } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const DOCK_BUTTON = "size-11 rounded-full text-moon hover:bg-tide/60 active:scale-95 aria-pressed:bg-amber aria-pressed:text-ink motion-reduce:active:scale-100";

/** A dock icon button with a tooltip naming it and its key; `wrap` lets a popover trigger wrap it. */
export function DockButton({
  icon: Icon,
  label,
  keys,
  pressed,
  onClick,
  wrap,
}: {
  icon: LucideIcon;
  label: string;
  keys?: string;
  pressed?: boolean;
  onClick?: () => void;
  wrap?: (button: ReactElement) => ReactElement;
}) {
  const button = <Button variant="ghost" size="icon" aria-label={label} aria-pressed={pressed} onClick={onClick} className={DOCK_BUTTON} />;
  return (
    <Tooltip>
      <TooltipTrigger render={wrap ? wrap(button) : button}>
        <Icon aria-hidden="true" className="size-5" />
      </TooltipTrigger>
      <TooltipContent side="top" className="tt-warm text-body">
        {label}
        {keys && <kbd className="ml-2 rounded border border-line px-1 text-small text-haze">{keys}</kbd>}
      </TooltipContent>
    </Tooltip>
  );
}

/** The thin divider between dock groups. */
export const DockDivider = () => <span aria-hidden="true" className="mx-1 h-6 w-px bg-line" />;

/** Slower / faster buttons around a live speed readout (inside a dock popover). */
export function SpeedStepper({ text, slower, faster, onStep }: { text: string; slower: string; faster: string; onStep(step: 1 | -1): void }) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="icon" aria-label={slower} onClick={() => onStep(-1)} className="size-11">
        <Minus aria-hidden="true" />
      </Button>
      <span aria-live="polite" className="min-w-20 text-center text-moon tabular-nums">
        {text}
      </span>
      <Button variant="ghost" size="icon" aria-label={faster} onClick={() => onStep(1)} className="size-11">
        <Plus aria-hidden="true" />
      </Button>
    </div>
  );
}
