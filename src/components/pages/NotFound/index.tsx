"use client";

import { Link } from "@tanstack/react-router";
import { ArrowRight } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { RISE, STAGGER } from "@/lib/motion";
import { PAGE_PATHS } from "@/router/modes";
import { useT } from "../../AppState/use-app-state";
import { SignalMark } from "../../SignalMark";

/** Any unknown address: "no signal", and the way back to the map. */
export function NotFoundPage() {
  const t = useT();
  return (
    <motion.section variants={STAGGER} initial="hidden" animate="shown" aria-labelledby="not-found-title" className="grid h-full place-content-center justify-items-start gap-6 px-6 py-12">
      <motion.div variants={RISE}>
        <SignalMark live={false} className="size-12 opacity-70" />
      </motion.div>
      <motion.h1 variants={RISE} id="not-found-title" data-page-title tabIndex={-1} className="display-tight font-serif text-headline">
        {t("notFound.title")}
      </motion.h1>
      <motion.p variants={RISE} className="max-w-md text-lead text-haze">
        {t("notFound.text")}
      </motion.p>
      <motion.div variants={RISE}>
        <Link to={PAGE_PATHS.listen} className="group inline-flex h-12 items-center gap-3 rounded-full bg-moon px-5 text-body text-ink">
          {t("notFound.back")}
          <ArrowRight aria-hidden="true" className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      </motion.div>
    </motion.section>
  );
}
