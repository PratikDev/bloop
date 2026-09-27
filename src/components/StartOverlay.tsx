"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAppState, useT } from "./AppState/use-app-state";
import { useCommands } from "./Commands/use-commands";
import { useLiveData } from "./LiveData/use-live-data";
import { StatusBadge } from "./StatusBadge";

/**
 * The first thing on the page. Sound can only start from a user gesture, so
 * "Start listening" is the first focusable element and creates the AudioContext.
 */
export function StartOverlay() {
  const { state } = useAppState();
  const { sstStatus } = useLiveData();
  const commands = useCommands();
  const t = useT();
  const [starting, setStarting] = useState(false);
  if (state.started) return null;

  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-8 bg-night px-4 text-center">
      <div className="max-w-md space-y-3">
        <h1 className="text-title font-semibold">{t("app.title")}</h1>
        <p className="text-lead text-moon">{t("start.lead")}</p>
        <p className="text-haze">{t("start.hint")}</p>
      </div>
      <Button
        autoFocus
        size="lg"
        disabled={starting}
        onClick={async () => {
          setStarting(true);
          await commands.start();
        }}
        className="h-12 rounded-lg bg-shapla px-6 text-lead text-ink hover:bg-shapla/90"
      >
        {t("start.button")}
      </Button>
      <div className="min-h-6">
        {sstStatus === "loading" && <StatusBadge kind="loading">{t("start.loading")}</StatusBadge>}
        {sstStatus === "error" && <StatusBadge kind="error">{t("error.ocean")}</StatusBadge>}
      </div>
    </div>
  );
}
