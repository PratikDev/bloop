"use client";

import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { formatIndex } from "@/lib/i18n";
import { SPRING } from "@/lib/motion";
import { useAppState, useT } from "../AppState/use-app-state";
import { NAV_ITEMS } from "./nav-items";

/**
 * The pages as stations on a radio dial: a stitched rail, each station's
 * number and name, and a needle that glides to the one tuned in.
 */
export function TuningDial({ className }: { className?: string }) {
  const { state } = useAppState();
  const t = useT();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav aria-label={t("nav.label")} className={cn("relative min-w-0", className)}>
      <span aria-hidden="true" className="stitch-x absolute inset-x-2 bottom-0 opacity-60" />
      {/* Five pages on a 320 px phone: the dial scrolls sideways inside itself, never the page. */}
      <ul className="flex items-stretch overflow-x-auto [scrollbar-width:none]">
        {NAV_ITEMS.map((item, i) => {
          const active = pathname === item.to;
          return (
            <li key={item.to} className="relative flex-1 shrink-0 lg:flex-none">
              <Link
                to={item.to}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex h-11 items-center justify-center gap-2 px-2 text-body whitespace-nowrap transition-colors duration-200 sm:px-3 lg:justify-start lg:px-4",
                  active ? "text-moon" : "text-haze hover:text-moon",
                )}
              >
                <span aria-hidden="true" className={cn("hidden font-mono text-small tabular-nums xl:inline", active ? "text-moon" : "text-haze group-hover:text-moon")}>
                  {formatIndex(i + 1, state.lang)}
                </span>
                <span className="hidden sm:inline">{t(item.label)}</span>
                <span className="sm:hidden">{t(item.short)}</span>
              </Link>
              {active && (
                <motion.span
                  layoutId="dial-needle"
                  transition={SPRING.gentle}
                  aria-hidden="true"
                  className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-shapla"
                />
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
