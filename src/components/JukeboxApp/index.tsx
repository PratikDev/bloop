"use client";

import { AnnouncerProvider } from "../Announcer";
import { AppStateProvider } from "../AppState";
import { useAppState } from "../AppState/use-app-state";
import { BottomBar } from "../BottomBar";
import { CommandsProvider } from "../Commands";
import { useCommands } from "../Commands/use-commands";
import { HelpDialog } from "../HelpDialog";
import { LiveDataProvider } from "../LiveData";
import { Opening } from "../Opening";
import { SidePanel } from "../panels/SidePanel";
import { StartOverlay } from "../StartOverlay";
import { StoryProvider } from "../Story";
import { TimeLapseProvider } from "../TimeLapse";
import { useTimeLapse } from "../TimeLapse/use-time-lapse";
import { TopBar } from "../TopBar";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { Stage } from "./Stage";

// Then vs Now (and its chart library) and Turntable (and three.js) load only when chosen.
const ThenNow = dynamic(() => import("../ThenNow").then((m) => m.ThenNow), { ssr: false });
const Turntable = dynamic(() => import("../Turntable").then((m) => m.Turntable), { ssr: false });
import { useGlobalEscape } from "./use-global-escape";

function Shell() {
  const { state } = useAppState();
  const commands = useCommands();
  const timeLapse = useTimeLapse();
  useGlobalEscape(commands, timeLapse.stop);

  return (
    <>
      <StartOverlay />
      <Opening />
      {/* Inert until Start, so "Start listening" is the first and only focusable thing. */}
      <div inert={!state.started} className="grid min-h-dvh grid-rows-[auto_1fr_auto] lg:h-dvh">
        <TopBar />
        <main
          className={cn(
            "grid min-h-0 content-start lg:content-stretch",
            // Turntable: one column that never outgrows the screen; on wide screens the side column can fold away.
            state.mode === "turntable" && "grid-cols-[minmax(0,1fr)]",
            state.mode === "turntable" && state.panelCollapsed ? "lg:grid-cols-[minmax(0,1fr)_auto]" : "lg:grid-cols-[minmax(0,1fr)_24rem]",
          )}
        >
          {state.mode === "thenNow" ? <ThenNow /> : state.mode === "turntable" ? <Turntable /> : <Stage />}
          <SidePanel />
        </main>
        <BottomBar />
      </div>
      <HelpDialog />
    </>
  );
}

export function JukeboxApp() {
  return (
    <AppStateProvider>
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
