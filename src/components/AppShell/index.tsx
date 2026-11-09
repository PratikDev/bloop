"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { Outlet } from "@tanstack/react-router";
import { MotionConfig } from "motion/react";
import { startEngineHandOff } from "@/lib/audio-engines";
import { AnnouncerProvider } from "../Announcer";
import { AppStateProvider } from "../AppState";
import type { Mode } from "../AppState/reducer";
import { useAppState } from "../AppState/use-app-state";
import { CommandsProvider } from "../Commands";
import { useCommands } from "../Commands/use-commands";
import { Dock } from "../Dock";
import { Header } from "../Header";
import { HelpDialog } from "../HelpDialog";
import { JukeboxJourney } from "../JukeboxJourney";
import { LiveDataProvider } from "../LiveData";
import { Opening } from "../Opening";
import { RecordsProvider } from "../Records";
import { StoryProvider } from "../Story";
import { TimeLapseProvider } from "../TimeLapse";
import { useTimeLapse } from "../TimeLapse/use-time-lapse";
import { SkipLinks } from "./SkipLinks";
import { StartGate } from "./StartGate";
import { useGlobalEscape } from "./use-global-escape";
import { useRouteSync, useUrlMode } from "./use-route-sync";

const CONTENT_ID = "content";
const GATE_FREE: readonly Mode[] = ["home", "how", "official"];

function Shell() {
  const { state } = useAppState();
  const commands = useCommands();
  const timeLapse = useTimeLapse();
  useGlobalEscape(commands, timeLapse.stop);
  useRouteSync();
  // The two sound engines never play at once unless a page asks (src/lib/audio-engines.ts).
  useEffect(() => startEngineHandOff(), []);
  // Home is the start screen; How we know and Official records can be read without it. The gate appears there only when
  // something asks for sound (a control marked data-needs-sound). Any other page opened before Start waits behind it.
  const [soundAsked, setSoundAsked] = useState(false);
  const gated = !state.started && (soundAsked || !GATE_FREE.includes(state.mode));
  const askForSound = (e: MouseEvent<HTMLElement>) => {
    if (state.started || !(e.target instanceof Element) || !e.target.closest("[data-needs-sound]")) return;
    e.preventDefault();
    e.stopPropagation();
    setSoundAsked(true);
  };
  // While the intro plays, Skip intro is the only thing that can take focus (as before the redesign).
  const opening = state.started && !state.introDone;

  return (
    <MotionConfig reducedMotion={state.reduceMotion ? "always" : "never"}>
      <SkipLinks contentId={CONTENT_ID} />
      {/* The frame is one screen tall: header and dock stay put, and a page taller than the space between them scrolls in main. */}
      <div inert={gated || opening} className="grid h-dvh grid-cols-[minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)_auto]">
        <Header />
        <main id={CONTENT_ID} tabIndex={-1} onClickCapture={askForSound} className="min-h-0 overflow-y-auto outline-none">
          <Outlet />
        </main>
        <Dock />
      </div>
      {gated && <StartGate />}
      <Opening />
      <JukeboxJourney />
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
                <RecordsProvider>
                  <Shell />
                </RecordsProvider>
              </StoryProvider>
            </TimeLapseProvider>
          </CommandsProvider>
        </LiveDataProvider>
      </AnnouncerProvider>
    </AppStateProvider>
  );
}
