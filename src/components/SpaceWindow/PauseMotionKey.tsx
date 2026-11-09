"use client";

import { Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAppState, useT } from "../AppState/use-app-state";
import type { PauseMotion } from "./use-pause-motion";

/** Stops a stage's self-running motion, never the sound. Nothing to pause under reduced motion, so it isn't shown. */
export function PauseMotionKey({ pause, className }: { pause: PauseMotion; className?: string }) {
  const { state } = useAppState();
  const t = useT();
  if (state.reduceMotion) return null;
  const Icon = pause.paused ? Play : Pause;
  return (
    <Button variant="ghost" aria-pressed={pause.paused} onClick={pause.toggle} className={cn("key h-11 gap-2 rounded-lg bg-paper px-3 text-body text-navy hover:bg-paper", className)}>
      <Icon aria-hidden="true" className="size-4" />
      {t("motion.pause")}
    </Button>
  );
}
