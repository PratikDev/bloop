"use client";

import { ArrowRight } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { buttonVariants } from "@/components/ui/button";
import { DATA_HEALTH_PATH } from "@/lib/earth/routes";
import { RISE } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useT } from "../../AppState/use-app-state";

/** How we know → Data health: the link to one row per record from the pipeline's health run. */
export function DataHealthCard() {
  const t = useT();
  return (
    <motion.section variants={RISE} aria-labelledby="data-health-card-title" className="surface-plate relative flex min-h-0 flex-col gap-2 overflow-hidden rounded-plate p-5 md:p-6" data-testid="data-health-card">
      <span aria-hidden="true" className="stitch-x absolute inset-x-5 top-0 opacity-60" />
      <h2 id="data-health-card-title" className="eyebrow">{t("earth.health.title")}</h2>
      <p className="font-serif text-title text-moon">{t("earth.health.cardTitle")}</p>
      <p className="text-body text-haze">{t("earth.health.cardLead")}</p>
      <Link to={DATA_HEALTH_PATH} className={cn(buttonVariants({ variant: "ghost" }), "-ml-3 mt-auto h-11 gap-2 self-start rounded-full px-3 text-body text-moon hover:bg-tide")}>
        {t("earth.health.open")}
        <ArrowRight aria-hidden="true" className="size-4" />
      </Link>
    </motion.section>
  );
}
