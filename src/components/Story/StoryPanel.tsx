"use client";

import { ArrowCounterClockwise, Stop } from "@phosphor-icons/react";
import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { takeFocus } from "@/lib/arrival-focus";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useT } from "../AppState/use-app-state";
import { StatusBadge } from "../StatusBadge";
import { SKIPPED_STEPS, STORY_STEPS } from "./script";
import { useStory, type StoryStepId } from "./use-story";

/** How long the tour's heading holds focus after starting from the player (frames, about half a second). */
const FOCUS_FRAMES = 30;

/** A step's dot: filled once done, coral and a size larger while current (no pulse). */
function StepDot({ index, current }: { index: number; current: number }) {
  const now = index === current;
  return (
    <span aria-hidden="true" className="relative grid size-2.5 shrink-0 place-items-center">
      {now && <span className="absolute -inset-1 rounded-full border-2 border-shapla" />}
      <span className={cn("size-2.5 rounded-full border", now ? "border-shapla bg-shapla" : index < current ? "border-haze bg-haze" : "border-line bg-night")} />
    </span>
  );
}

function SkippedBadge({ id }: { id: StoryStepId }) {
  const t = useT();
  return SKIPPED_STEPS.has(id) ? <StatusBadge kind="october">{t("badge.comingOctober")}</StatusBadge> : null;
}

/**
 * The tour's steps on a stitched timeline, and the line being narrated. The
 * line is hidden from screen readers: it is already spoken, or announced, as it starts.
 * Phones show the steps as a row of dots and the current step's name, so the
 * map stays in view; the full list is still there for screen readers.
 */
export function StoryPanel({ className }: { className?: string }) {
  const story = useStory();
  const t = useT();
  const current = story.step ? STORY_STEPS.indexOf(story.step) : story.status === "finished" ? STORY_STEPS.length : -1;
  const currentId = story.step;
  const heading = useRef<HTMLHeadingElement>(null);
  // Started from the player: focus comes to the tour's heading. The Records sheet hands focus back to its key as it
  // closes, a few frames later, so the heading takes it back until it sticks (about half a second at most).
  useEffect(() => {
    if (!takeFocus("tour")) return;
    let frames = 0;
    let id = requestAnimationFrame(function hold() {
      if (document.activeElement !== heading.current) heading.current?.focus({ preventScroll: true });
      if (++frames < FOCUS_FRAMES) id = requestAnimationFrame(hold);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <section aria-labelledby="story-heading" className={cn("space-y-3 text-body", className)}>
      <h2 ref={heading} id="story-heading" tabIndex={-1} className="eyebrow outline-none">
        {t("story.heading")}
      </h2>

      <div aria-hidden="true" className="flex flex-wrap items-center gap-x-3 gap-y-1 lg:hidden">
        <span className="flex items-center gap-1.5">
          {STORY_STEPS.map((id, i) => (
            <StepDot key={id} index={i} current={current} />
          ))}
        </span>
        {currentId && (
          <>
            <span className="font-medium text-moon">{t(`story.step.${currentId}`)}</span>
            <SkippedBadge id={currentId} />
          </>
        )}
      </div>

      <div className="relative max-lg:sr-only">
        <span aria-hidden="true" className="stitch-y absolute top-2 bottom-2 left-[0.3rem] opacity-50" />
        <ol className="space-y-1.5">
          {STORY_STEPS.map((id, i) => (
            <li
              key={id}
              aria-current={i === current ? "step" : undefined}
              className={cn("relative flex flex-wrap items-center gap-x-3 gap-y-1 transition-colors duration-300", i === current ? "font-medium text-moon" : "text-haze")}
            >
              <StepDot index={i} current={current} />
              {t(`story.step.${id}`)}
              <SkippedBadge id={id} />
            </li>
          ))}
        </ol>
      </div>

      {/* Room for a few lines, so the map below doesn't jump as each line comes in (phones). */}
      <div className="min-h-24 lg:min-h-0">
        <AnimatePresence mode="wait">
          {story.line && (
            <motion.div
              key={story.line.text}
              aria-hidden="true"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="space-y-1"
            >
              <p className="text-lead leading-snug text-moon lg:short:text-body">{story.line.text}</p>
              {story.line.source && <p className="text-small text-haze">{t("story.source", { source: story.line.source })}</p>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="flex flex-wrap gap-2">
        {story.status === "finished" && (
          <Button onClick={story.replay} className="h-11 gap-2 key border-navy rounded-full bg-moon px-4 text-body text-ink hover:bg-moon">
            <ArrowCounterClockwise aria-hidden="true" className="size-4" />
            {t("story.replay")}
          </Button>
        )}
        <Button variant="ghost" onClick={story.exit} className="h-11 gap-2 rounded-full px-4 text-body ring-1 ring-line hover:bg-tide">
          {story.status !== "finished" && <Stop aria-hidden="true" weight="fill" className="size-4" />}
          {t(story.status === "finished" ? "story.backToExplore" : "story.stop")}
        </Button>
      </div>
    </section>
  );
}
