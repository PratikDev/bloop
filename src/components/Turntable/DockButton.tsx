"use client";

import { Minus, Plus, type LucideIcon } from "lucide-react";
import { cloneElement, type ReactElement, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const DOCK_KEY = "key h-auto min-h-11 gap-2 rounded-lg bg-paper px-3 py-1 text-body font-normal whitespace-normal text-moon hover:bg-paper aria-expanded:bg-tide aria-pressed:bg-tide";
const PRIMARY_KEY = "bg-shapla hover:bg-shapla aria-pressed:bg-shapla";

/** A labelled key: icon and visible text, its shortcut in a tooltip. `wrap` lets a popover trigger wrap it. */
export function DockButton({
  icon: Icon,
  label,
  short,
  keys,
  inlineKeys = false,
  pressed,
  primary = false,
  autoFocus = false,
  className,
  onClick,
  wrap,
}: {
  icon: LucideIcon;
  /** The accessible name. */
  label: string;
  /** Shorter visible text, when the name is long (the name starts with the same words). */
  short?: string;
  keys?: string;
  /** Print the shortcut in the row (a list in a popover), instead of in a tooltip that would cover the next item. */
  inlineKeys?: boolean;
  pressed?: boolean;
  /** The bar's one coral action. */
  primary?: boolean;
  autoFocus?: boolean;
  className?: string;
  onClick?: () => void;
  wrap?: (button: ReactElement) => ReactElement;
}) {
  const button = <Button variant="ghost" autoFocus={autoFocus} aria-label={label} aria-pressed={pressed} onClick={onClick} className={cn(DOCK_KEY, primary && PRIMARY_KEY, className)} />;
  const target = wrap ? wrap(button) : button;
  const content: ReactNode = (
    <>
      <Icon aria-hidden="true" className="size-5 shrink-0" />
      {short ?? label}
      {keys && inlineKeys && <kbd className="ml-auto text-small text-haze">{keys}</kbd>}
    </>
  );
  if (!keys || inlineKeys) return cloneElement(target, undefined, content);
  return (
    <Tooltip>
      <TooltipTrigger render={target}>{content}</TooltipTrigger>
      <TooltipContent side="top" className="tt-warm text-body">
        <kbd className="rounded border border-line px-1 text-small text-haze">{keys}</kbd>
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
