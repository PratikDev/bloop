"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useT } from "../AppState/use-app-state";
import { StatusBadge } from "../StatusBadge";
import { SKIPPED_STEPS, STORY_STEPS } from "./script";
import { useStory } from "./use-story";

/**
 * The tour's steps and the line being narrated. The line is hidden from
 * screen readers: it is already spoken, or announced, as it starts.
 */
export function StoryPanel({ className }: { className?: string }) {
  const story = useStory();
  const t = useT();
  const current = story.step ? STORY_STEPS.indexOf(story.step) : story.status === "finished" ? STORY_STEPS.length : -1;

  return (
    <section aria-labelledby="story-heading" className={cn("space-y-3 text-body", className)}>
      <h2 id="story-heading" className="text-lead font-medium">
        {t("story.heading")}
      </h2>
      <ol className="space-y-1">
        {STORY_STEPS.map((id, i) => (
          <li
            key={id}
            aria-current={i === current ? "step" : undefined}
            className={cn("flex items-center gap-2", i === current ? "font-medium text-moon" : "text-haze")}
          >
            <span aria-hidden="true" className="w-4 text-center">
              {i === current ? "▸" : i < current ? "✓" : "·"}
            </span>
            {t(`story.step.${id}`)}
            {SKIPPED_STEPS.has(id) && <StatusBadge kind="october">{t("badge.comingOctober")}</StatusBadge>}
          </li>
        ))}
      </ol>
      {story.line && (
        <div aria-hidden="true" className="space-y-1">
          <p className="font-serif text-lead text-moon">{story.line.text}</p>
          {story.line.source && <p className="text-small text-haze">{t("story.source", { source: story.line.source })}</p>}
          {story.step === "truth" && <StatusBadge kind="pending">{t("badge.pending")}</StatusBadge>}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {story.status === "finished" && (
          <Button variant="secondary" onClick={story.replay} className="h-11 px-4 text-body">
            {t("story.replay")}
          </Button>
        )}
        <Button variant={story.status === "finished" ? "ghost" : "secondary"} onClick={story.exit} className="h-11 px-4 text-body">
          {t(story.status === "finished" ? "story.backToExplore" : "story.stop")}
        </Button>
      </div>
    </section>
  );
}
