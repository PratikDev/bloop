"use client";

import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useT } from "../AppState/use-app-state";
import { NAV_ITEMS } from "./nav-items";

/** The pages as pills: navy for the current one, paper for the rest. */
export function TuningDial({ className }: { className?: string }) {
  const t = useT();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav aria-label={t("nav.label")} className={cn("min-w-0", className)}>
      {/* On a 320 px phone the row scrolls sideways inside itself, never the page; the padding leaves room for the shadows. */}
      <ul className="flex items-center gap-2 overflow-x-auto py-1 pr-1 pl-0.5 [scrollbar-width:none]">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.to;
          return (
            <li key={item.to} className="shrink-0">
              <Link
                to={item.to}
                aria-current={active ? "page" : undefined}
                className={cn("key flex h-11 items-center rounded-full px-4 text-body whitespace-nowrap", active ? "bg-moon text-ink" : "bg-paper text-moon")}
              >
                <span className="hidden sm:inline">{t(item.label)}</span>
                <span className="sm:hidden">{t(item.short)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
