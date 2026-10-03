"use client";

import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { formatIndex } from "@/lib/i18n";
import { RISE, STAGGER } from "@/lib/motion";
import { useAppState, useT } from "../../AppState/use-app-state";
import { NAV_ITEMS } from "../../Header/nav-items";

/** The three pages as stations on the dial: number, name, one line on what each shows. */
export function Stations() {
  const { state } = useAppState();
  const t = useT();
  return (
    <motion.nav aria-label={t("home.stations")} variants={STAGGER} initial="hidden" animate="shown" className="px-4 pb-4 md:px-8 lg:px-12 lg:pb-6">
      <ul className="grid gap-2 md:grid-cols-3 md:gap-4">
        {NAV_ITEMS.map((item, i) => (
          <motion.li key={item.to} variants={RISE}>
            <Link to={item.to} className="group relative flex h-full flex-col gap-1.5 rounded-plate px-4 pt-4 pb-3 transition-colors duration-300 hover:bg-dusk/80">
              <span aria-hidden="true" className="stitch-x absolute inset-x-4 top-0 opacity-70 transition-opacity group-hover:opacity-100" />
              <span className="flex items-baseline justify-between gap-3">
                <span className="flex items-baseline gap-3">
                  <span aria-hidden="true" className="font-mono text-small text-shapla tabular-nums">
                    {formatIndex(i + 1, state.lang)}
                  </span>
                  <span className="font-serif text-title">{t(item.label)}</span>
                </span>
                <ArrowUpRight aria-hidden="true" className="size-5 text-haze transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-shapla" />
              </span>
              <span className="text-small text-haze md:text-body">{t(item.blurb)}</span>
            </Link>
          </motion.li>
        ))}
      </ul>
    </motion.nav>
  );
}
