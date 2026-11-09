"use client";

import { useState } from "react";
import { ArrowRight, Headphones } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useT } from "../AppState/use-app-state";
import { useCommands } from "../Commands/use-commands";
import { useLiveData } from "../LiveData/use-live-data";
import { StatusBadge } from "../StatusBadge";

/** The quiet text button beside the main one (Explore without sound). */
const QUIET_BUTTON = "h-13 rounded-full px-5 text-body text-moon underline-offset-4 hover:bg-transparent hover:underline";

/** A secondary action beside the coral one (Home's tour): paper fill. */
export const PAPER_KEY = "inline-flex h-13 items-center key rounded-full bg-paper px-5 text-body text-moon hover:bg-paper";

/** The headphones line, once, under the actions. */
export function StartHint() {
  const t = useT();
  return <p className="max-w-md text-small text-haze">{t("start.hint")}</p>;
}

/**
 * Start listening and Explore without sound (Home and the start gate). Sound can
 * only start from a user gesture, so Start listening creates the AudioContext
 * inside the click. `after` runs once started (Home moves on to Listen); `onTour` adds the tour key, which starts the
 * same way and then runs it instead. `silentHint` explains Explore without sound (the start gate).
 */
export function StartActions({
  after,
  onTour,
  silentHint = false,
  autoFocus = false,
  className,
}: {
  after?: () => void;
  onTour?: () => void;
  silentHint?: boolean;
  autoFocus?: boolean;
  className?: string;
}) {
  const { sstStatus } = useLiveData();
  const commands = useCommands();
  const t = useT();
  const [starting, setStarting] = useState(false);

  const start = async (then?: () => void) => {
    setStarting(true);
    // If audio fails to start, the buttons come back so nobody is stuck.
    try {
      await commands.start();
      then?.();
    } finally {
      setStarting(false);
    }
  };
  const startSilent = () => {
    commands.startSilent();
    after?.();
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          autoFocus={autoFocus}
          disabled={starting}
          onClick={() => void start(after)}
          className="group h-13 gap-3 key rounded-full bg-shapla pr-5 pl-3 text-lead text-moon hover:bg-shapla"
        >
          <span className="grid size-8 place-items-center rounded-full bg-moon/10">
            <Headphones aria-hidden="true" weight="fill" className="size-4.5" />
          </span>
          {t("start.button")}
          <ArrowRight aria-hidden="true" className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Button>
        {onTour && (
          <Button disabled={starting} onClick={() => void start(onTour)} className={PAPER_KEY}>
            {t("home.tour")}
          </Button>
        )}
        <Button
          variant="ghost"
          disabled={starting}
          aria-describedby={silentHint ? "start-silent-hint" : undefined}
          onClick={startSilent}
          className={QUIET_BUTTON}
        >
          {t("start.silent")}
        </Button>
      </div>
      {silentHint && (
        <p id="start-silent-hint" className="max-w-md text-small text-haze">
          {t("start.silentHint")}
        </p>
      )}
      <StartHint />
      <div className="min-h-6" aria-live="polite">
        {sstStatus === "loading" && <StatusBadge kind="loading">{t("start.loading")}</StatusBadge>}
        {sstStatus === "error" && <StatusBadge kind="error">{t("error.ocean")}</StatusBadge>}
      </div>
    </div>
  );
}
