"use client";

import { Pause, Play } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useAppState, useT } from "../AppState/use-app-state";
import type { PauseMotion } from "./use-pause-motion";

/**
 * Stops a stage's self-running motion, never the sound. Nothing to pause under reduced motion, so it isn't shown.
 * `compact`: a small 36 px icon key for a stage's corner, named "Pause motion" (its pressed state says whether it's paused);
 * to a finger its hit area reaches 44 px without the key drawing any larger.
 */
export function PauseMotionKey({ pause, compact = false, className }: { pause: PauseMotion; compact?: boolean; className?: string }) {
  const { state } = useAppState();
  const t = useT();
  if (state.reduceMotion) return null;
  const Icon = pause.paused ? Play : Pause;
  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              aria-pressed={pause.paused}
              aria-label={t("motion.pause")}
              onClick={pause.toggle}
              className={cn("key border-navy relative size-9 rounded-lg bg-paper p-0 text-navy hover:bg-paper pointer-coarse:before:absolute pointer-coarse:before:-inset-1 pointer-coarse:before:content-['']", className)}
            />
          }
        >
          <Icon aria-hidden="true" weight="fill" className="size-4" />
        </TooltipTrigger>
        <TooltipContent side="left" className="text-body">
          {t("motion.pause")}
        </TooltipContent>
      </Tooltip>
    );
  }
  return (
    <Button variant="ghost" aria-pressed={pause.paused} onClick={pause.toggle} className={cn("key border-navy h-11 gap-2 rounded-lg bg-paper px-3 text-body text-navy hover:bg-paper", className)}>
      <Icon aria-hidden="true" className="size-4" />
      {t("motion.pause")}
    </Button>
  );
}
