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
import { TopBar } from "../TopBar";
import dynamic from "next/dynamic";
import { Stage } from "./Stage";

// Then vs Now (and its chart library) loads only when chosen.
const ThenNow = dynamic(() => import("../ThenNow").then((m) => m.ThenNow), { ssr: false });
import { useGlobalEscape } from "./use-global-escape";

function Shell() {
  const { state } = useAppState();
  const commands = useCommands();
  useGlobalEscape(commands);

  return (
    <>
      <StartOverlay />
      <Opening />
      {/* Inert until Start, so "Start listening" is the first and only focusable thing. */}
      <div inert={!state.started} className="grid min-h-dvh grid-rows-[auto_1fr_auto] lg:h-dvh">
        <TopBar />
        <main className="grid min-h-0 content-start lg:content-stretch lg:grid-cols-[minmax(0,1fr)_24rem]">
          {state.mode === "thenNow" ? <ThenNow /> : <Stage />}
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
            <Shell />
          </CommandsProvider>
        </LiveDataProvider>
      </AnnouncerProvider>
    </AppStateProvider>
  );
}
