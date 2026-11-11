"use client";

import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { RISE, STAGGER } from "@/lib/motion";
import { PAGE_PATHS } from "@/router/modes";
import { useAppState, useT } from "../../AppState/use-app-state";
import { useCommands } from "../../Commands/use-commands";
import { FrameLabel } from "../../FrameLabel";
import { Globe } from "../../Globe";
import { QUIET_BUTTON, StartActions } from "../../StartActions";
import { Stations } from "./Stations";

/**
 * Home: what this is, in one line, on today's real frame turning as a globe;
 * the one thing to do (Start listening); and the three pages below.
 */
export function HomePage() {
  const { state } = useAppState();
  const t = useT();
  const commands = useCommands();
  const navigate = useNavigate();
  const toListen = () => void navigate({ to: PAGE_PATHS.listen });

  return (
    // The hero never shrinks below its content: on a short screen (1280×720 before sound is chosen) Home scrolls
    // rather than painting the hero over the stations, which blocked their first click.
    <div className="flex h-full min-h-0 flex-col overflow-y-auto">
      <section aria-labelledby="home-title" className="relative grid min-h-min flex-1 items-center gap-6 px-4 pt-4 md:px-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-10 lg:px-12">
        <motion.div variants={STAGGER} initial="hidden" animate="shown" className="relative z-10 space-y-6 md:space-y-8">
          <motion.p variants={RISE} className="eyebrow flex items-center gap-2">
            <span aria-hidden="true" className="size-1.5 animate-pulse rounded-full bg-shapla" />
            {t("home.eyebrow")}
          </motion.p>
          <motion.h1 variants={RISE} id="home-title" data-page-title tabIndex={-1} className="display-tight font-serif text-display">
            {t("home.titleLead")} <em className="text-shapla">{t("home.titleAccent")}</em>
          </motion.h1>
          <motion.p variants={RISE} className="max-w-lg text-lead text-moon/90">
            {t("start.lead")}
          </motion.p>
          <motion.div variants={RISE}>
            {state.started ? (
              <div className="flex flex-wrap items-center gap-3">
                <Link to={PAGE_PATHS.listen} className="group inline-flex h-13 items-center gap-3 rounded-full bg-shapla pr-5 pl-6 text-lead text-ink shadow-glow transition-transform duration-200 active:scale-[0.98]">
                  {t("home.continue")}
                  <ArrowRight aria-hidden="true" className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
                {/* The Start buttons come back in its place, Start listening focused. */}
                <Button variant="ghost" onClick={commands.resetStart} className={QUIET_BUTTON}>
                  {t("home.resetChoice")}
                </Button>
              </div>
            ) : (
              <StartActions autoFocus after={toListen} />
            )}
          </motion.div>
        </motion.div>

        {/* Beside the text (lg), the globe takes the height left: its own size never sets the hero's height. */}
        <div className="relative mx-auto flex w-full max-w-md flex-col items-center gap-3 lg:h-full lg:max-w-none lg:min-h-0 lg:py-4 lg:[contain:size]">
          <Globe className="w-full max-w-[34rem] lg:min-h-0 lg:w-auto lg:max-w-full lg:flex-1" />
          <FrameLabel className="max-w-sm text-center" />
        </div>
      </section>
      <Stations />
      <footer className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 pb-4 text-small text-haze md:px-8 lg:px-12">
        <Link to={PAGE_PATHS.team} className="underline underline-offset-2 hover:text-moon">
          {t("team.title")}
        </Link>
        <span>{t("credits.visualizations")}</span>
      </footer>
    </div>
  );
}
