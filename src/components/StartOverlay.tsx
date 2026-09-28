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
 * "Explore without sound" comes second, so nobody is locked out by audio.
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
      <div className="flex flex-col items-center gap-3">
        <Button
          autoFocus
          size="lg"
          disabled={starting}
          onClick={async () => {
            setStarting(true);
            // If audio fails to start, both buttons come back so nobody is stuck.
            try {
              await commands.start();
            } finally {
              setStarting(false);
            }
          }}
          className="h-12 rounded-lg bg-shapla px-6 text-lead text-ink hover:bg-shapla/90"
        >
          {t("start.button")}
        </Button>
        <Button
          variant="outline"
          size="lg"
          disabled={starting}
          aria-describedby="start-silent-hint"
          onClick={commands.startSilent}
          className="h-11 rounded-lg px-5 text-body"
        >
          {t("start.silent")}
        </Button>
        <p id="start-silent-hint" className="max-w-xs text-small text-haze">
          {t("start.silentHint")}
        </p>
      </div>
      <div className="min-h-6">
        {sstStatus === "loading" && <StatusBadge kind="loading">{t("start.loading")}</StatusBadge>}
        {sstStatus === "error" && <StatusBadge kind="error">{t("error.ocean")}</StatusBadge>}
      </div>
    </div>
  );
}
