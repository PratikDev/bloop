"use client";

import { useState } from "react";
import { ArrowRight, Headphones } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useT } from "../AppState/use-app-state";
import { useCommands } from "../Commands/use-commands";
import { useLiveData } from "../LiveData/use-live-data";
import { StatusBadge } from "../StatusBadge";

/**
 * Start listening and Explore without sound (Home and the start gate). Sound can
 * only start from a user gesture, so Start listening creates the AudioContext
 * inside the click. `after` runs once started (Home moves on to Listen).
 */
export function StartActions({ after, autoFocus = false, className }: { after?: () => void; autoFocus?: boolean; className?: string }) {
  const { sstStatus } = useLiveData();
  const commands = useCommands();
  const t = useT();
  const [starting, setStarting] = useState(false);

  const start = async () => {
    setStarting(true);
    // If audio fails to start, both buttons come back so nobody is stuck.
    try {
      await commands.start();
      after?.();
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
          onClick={() => void start()}
          className="group h-13 gap-3 rounded-full bg-shapla pr-5 pl-3 text-lead text-ink shadow-glow transition-transform duration-200 hover:bg-shapla hover:brightness-105 active:scale-[0.98]"
        >
          <span className="grid size-8 place-items-center rounded-full bg-ink/10">
            <Headphones aria-hidden="true" weight="fill" className="size-4.5" />
          </span>
          {t("start.button")}
          <ArrowRight aria-hidden="true" className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Button>
        <Button
          variant="ghost"
          disabled={starting}
          aria-describedby="start-silent-hint"
          onClick={startSilent}
          className="h-13 rounded-full px-5 text-body text-moon underline-offset-4 hover:bg-transparent hover:underline"
        >
          {t("start.silent")}
        </Button>
      </div>
      <div className="max-w-md space-y-1 text-small text-haze">
        <p id="start-silent-hint">{t("start.silentHint")}</p>
        <p>{t("start.hint")}</p>
      </div>
      <div className="min-h-6" aria-live="polite">
        {sstStatus === "loading" && <StatusBadge kind="loading">{t("start.loading")}</StatusBadge>}
        {sstStatus === "error" && <StatusBadge kind="error">{t("error.ocean")}</StatusBadge>}
      </div>
    </div>
  );
}
