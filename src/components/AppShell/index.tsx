"use client";

import { useEffect } from "react";
import { Outlet } from "@tanstack/react-router";
import { MotionConfig } from "motion/react";
import { startEngineHandOff } from "@/lib/audio-engines";
import { AnnouncerProvider } from "../Announcer";
import { AppStateProvider } from "../AppState";
import { useAppState, useT } from "../AppState/use-app-state";
import { CommandsProvider } from "../Commands";
import { useCommands } from "../Commands/use-commands";
import { Dock } from "../Dock";
import { Header } from "../Header";
import { HelpDialog, HelpPanel } from "../HelpDialog";
import { LiveDataProvider } from "../LiveData";
import { Opening } from "../Opening";
import { StoryProvider } from "../Story";
import { TimeLapseProvider } from "../TimeLapse";
import { useTimeLapse } from "../TimeLapse/use-time-lapse";
import { StartGate } from "./StartGate";
import { TapToStart } from "./TapToStart";
import { useGlobalEscape } from "./use-global-escape";
import { useRouteSync, useUrlMode } from "./use-route-sync";
import { cn } from "@/lib/utils";
import { lowVisionFlow, useApplyLowVision } from "../LowVision/use-apply-low-vision";

const CONTENT_ID = "content";

function Shell() {
  const { state } = useAppState();
  const t = useT();
  const commands = useCommands();
  const timeLapse = useTimeLapse();
  useGlobalEscape(commands, timeLapse.stop);
  useRouteSync();
  useApplyLowVision();
  // The two sound engines never play at once unless a page asks (src/lib/audio-engines.ts).
  useEffect(() => startEngineHandOff(), []);
  // Home is the start screen itself; any other page opened before Start waits behind the gate.
  const gated = !state.started && state.mode !== "home";
  // While the intro plays, Skip intro is the only thing that can take focus (as before the redesign).
  const opening = state.started && !state.introDone;

  return (
    <MotionConfig reducedMotion={state.reduceMotion ? "always" : "never"}>
      <a
        href={`#${CONTENT_ID}`}
        className="fixed top-2 left-2 z-(--layer-start) -translate-y-20 rounded-lg bg-shapla px-4 py-2 text-body text-ink focus-visible:translate-y-0"
      >
        {t("app.skipToContent")}
      </a>
      {/* Page height = screen height from 768 px up: pages fit one screen, nothing scrolls but what must. */}
      {/* Low-vision layouts (larger text and controls, the legend, compact centre) need the page to scroll instead. */}
      <div inert={gated || opening} className={cn("grid min-h-dvh grid-cols-[minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)_auto]", !lowVisionFlow(state.lowVision) && "md:h-dvh")}>
        <Header />
        <main id={CONTENT_ID} tabIndex={-1} className="min-h-0 outline-none">
          <HelpPanel className="mx-auto my-3 max-w-3xl" />
          <Outlet />
        </main>
        <Dock />
      </div>
      {gated && <StartGate />}
      <TapToStart />
      <Opening />
      <HelpDialog />
    </MotionConfig>
  );
}

/** The root route: every provider, then the page frame. State and sound carry across pages. */
export function AppShell() {
  // Only the first value is used: after that, useRouteSync keeps the state in step.
  const initialMode = useUrlMode();
  return (
    <AppStateProvider initialMode={initialMode}>
      <AnnouncerProvider>
        <LiveDataProvider>
          <CommandsProvider>
            <TimeLapseProvider>
              <StoryProvider>
                <Shell />
              </StoryProvider>
            </TimeLapseProvider>
          </CommandsProvider>
        </LiveDataProvider>
      </AnnouncerProvider>
    </AppStateProvider>
  );
}
