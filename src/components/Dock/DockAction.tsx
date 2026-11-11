"use client";

import type { ComponentProps, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DOCK_BUTTON, DOCK_LONG_LABEL, DOCK_SHORT_LABEL } from "./dock-button";

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
