"use client";

import type { ComponentProps, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DOCK_BUTTON } from "./dock-button";

/**
 * A dock action: an icon with a short word under it on phones, and `label`
 * (or the full name) beside it from 768 px. The full name is the button's name
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
      <span aria-hidden="true" className="md:hidden">
        {short}
      </span>
      <span aria-hidden="true" className="hidden md:inline">
        {label}
      </span>
    </Button>
  );
}
