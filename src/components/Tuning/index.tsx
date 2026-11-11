"use client";

import { useEffect, useId, useRef } from "react";
import { Button } from "@/components/ui/button";
import { FLAGS } from "@/lib/flags";
import { formatInteger } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useAppState, useT } from "../AppState/use-app-state";
import { LowVisionToggle } from "../LowVision/HeaderButtons";
import { useTuning } from "./use-tuning";

/**
 * Track 0 "Tuning": before the first exploration, the sounds' meaning one step at a time
 * (anchors with their values, the reference tone, each record's source, the sound grammar). Skippable and remembered;
 * Help plays it again. A panel beside the map, never a full-screen pop-up; focus moves to its heading when it opens.
 */
export function TuningPanel({ className }: { className?: string }) {
  const { state } = useAppState();
  const t = useT();
  const tuning = useTuning();
  const headingId = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  const last = tuning.index === tuning.steps.length - 1;

  useEffect(() => heading.current?.focus(), []);

  return (
    <section aria-labelledby={headingId} data-testid="tuning" className={cn("surface-glass max-w-md space-y-3 rounded-plate p-4 text-body", className)}>
      <div className="space-y-1">
        <h2 id={headingId} ref={heading} tabIndex={-1} className="font-serif text-lead">
          {t("tuning.title")}
        </h2>
        <p className="text-small text-haze">
          {t("tuning.progress", { n: formatInteger(tuning.index + 1, state.lang), total: formatInteger(tuning.steps.length, state.lang) })}
        </p>
      </div>
      <p data-testid="tuning-text">{tuning.step.text(t, state.lang)}</p>
      {/* The low-vision preset is offered here too, on every step, for anyone who uses their remaining sight. */}
      {FLAGS.lowVision && (
        <div className="space-y-1 border-t border-glass-edge pt-3">
          <LowVisionToggle label="lv.tuningToggle" className="ring-1 ring-glass-edge" />
          <p className="text-small text-haze">{t("lv.tuningNote")}</p>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {last ? (
          <Button size="lg" onClick={tuning.finish} className="h-11 rounded-full bg-shapla text-ink hover:bg-shapla/90">
            {t("tuning.finish")}
          </Button>
        ) : (
          <Button size="lg" onClick={tuning.next} className="h-11 rounded-full bg-shapla text-ink hover:bg-shapla/90">
            {t("tuning.next")}
          </Button>
        )}
        <Button size="lg" variant="outline" onClick={tuning.again} className="h-11 rounded-full">
          {t("tuning.again")}
        </Button>
        {!last && (
          <Button size="lg" variant="ghost" onClick={tuning.finish} className="h-11 rounded-full">
            {t("tuning.skip")}
          </Button>
        )}
      </div>
    </section>
  );
}
