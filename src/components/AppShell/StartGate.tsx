"use client";

import { motion } from "motion/react";
import { RISE, STAGGER } from "@/lib/motion";
import { useT } from "../AppState/use-app-state";
import { LanguageChoice } from "../LanguageChoice";
import { SignalMark } from "../SignalMark";
import { StartActions } from "../StartActions";

/**
 * A page opened directly (a shared link) before Start: the same two choices as
 * Home, over the dimmed page, as the only thing that can take focus.
 */
export function StartGate() {
  const t = useT();
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="start-gate-title" className="fixed inset-0 z-(--layer-start) grid place-items-center bg-night/80 px-4 backdrop-blur-md">
      <motion.div variants={STAGGER} initial="hidden" animate="shown" className="surface-glass w-full max-w-xl space-y-6 rounded-sheet p-6 md:p-10">
        <motion.div variants={RISE} className="flex items-center justify-between">
          <SignalMark className="size-10" />
          {/* The page behind is inert, so the language can be chosen here before starting. */}
          <LanguageChoice />
        </motion.div>
        <motion.div variants={RISE} className="space-y-3">
          <h1 id="start-gate-title" className="display-tight font-serif text-headline">
            {t("app.title")}
          </h1>
          <p className="text-lead text-moon">{t("start.lead")}</p>
        </motion.div>
        <motion.div variants={RISE}>
          <StartActions autoFocus />
        </motion.div>
      </motion.div>
    </div>
  );
}
