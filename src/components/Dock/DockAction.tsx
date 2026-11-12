"use client";

import type { ComponentProps, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DOCK_BUTTON, DOCK_BUTTON_FIXED } from "./dock-button";

/**
 * A dock action: an icon with a short word under it on phones, and `label`
 * (or the full name) beside it from 1024 px. The full name is the button's name
 * everywhere (each visible word is part of it, WCAG 2.5.3), so it never
 * changes with the screen. `fixed` keeps the 1024 px look (icon beside `label`) from 640 px, the icon alone below it.
 */
export function DockAction({
  icon,
  full,
  label = full,
  short,
  fixed = false,
  className,
  ...props
}: { icon: ReactNode; full: string; label?: string; short: string; fixed?: boolean } & Omit<ComponentProps<typeof Button>, "children">) {
  return (
    <Button variant="ghost" aria-label={full} className={cn(fixed ? DOCK_BUTTON_FIXED : DOCK_BUTTON, className)} {...props}>
      {icon}
      {fixed ? (
        <span aria-hidden="true" className="max-sm:hidden">{label}</span>
      ) : (
        <>
          <span aria-hidden="true" className="lg:hidden">
            {short}
          </span>
          <span aria-hidden="true" className="hidden lg:inline">
            {label}
          </span>
        </>
      )}
    </Button>
  );
}
