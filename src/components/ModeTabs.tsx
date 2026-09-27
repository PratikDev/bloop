"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Mode } from "./AppState/reducer";
import { useAppState, useT } from "./AppState/use-app-state";
import { useCommands } from "./Commands/use-commands";

const MODES: { mode: Mode; label: "mode.explore" | "mode.story" | "mode.thenNow"; ready: boolean }[] = [
  { mode: "explore", label: "mode.explore", ready: true },
  { mode: "story", label: "mode.story", ready: false },
  { mode: "thenNow", label: "mode.thenNow", ready: true },
];

/** Explore, Story, Then vs Now. Modes not built yet say so, rather than pretending. */
export function ModeTabs({ className }: { className?: string }) {
  const { state } = useAppState();
  const commands = useCommands();
  const t = useT();
  return (
    <Tabs value={state.mode} onValueChange={(v: Mode) => commands.setMode(v)} className={className}>
      <TabsList aria-label={t("mode.label")} className="w-full bg-night group-data-horizontal/tabs:h-13 md:w-auto">
        {MODES.map((m) => (
          <TabsTrigger
            key={m.mode}
            value={m.mode}
            disabled={!m.ready}
            className="h-full flex-col gap-0 px-3 text-body leading-tight data-active:bg-tide aria-disabled:text-haze aria-disabled:opacity-100 data-disabled:opacity-100"
          >
            {t(m.label)}
            {!m.ready && <span className="text-small text-haze">{t("mode.notReady")}</span>}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
