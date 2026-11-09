"use client";

import type { ComponentProps, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DOCK_BUTTON, DOCK_LONG_LABEL, DOCK_SHORT_LABEL } from "./dock-button";

/**
 * A dock action: an icon with a short word under it, and `label`
 * (or the full name) beside it from 1536 px (dock-button.ts). The full name is the button's name
 * everywhere (each visible word is part of it, WCAG 2.5.3), so it never
 * changes with the screen.
 */
export function DockAction({
  icon,
  full,
  label = full,
  short,
  className,
  ...props
}: { icon: ReactNode; full: string; label?: string; short: string } & Omit<ComponentProps<typeof Button>, "children">) {
  return (
    <Button variant="ghost" aria-label={full} className={cn(DOCK_BUTTON, className)} {...props}>
      {icon}
      <span aria-hidden="true" className={DOCK_SHORT_LABEL}>
        {short}
      </span>
      <span aria-hidden="true" className={DOCK_LONG_LABEL}>
        {label}
      </span>
    </Button>
  );
}
