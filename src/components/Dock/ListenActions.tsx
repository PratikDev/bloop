"use client";

import { Broadcast, Compass, Info, Keyboard } from "@phosphor-icons/react";
import { useAppState, useT } from "../AppState/use-app-state";
import { useCommands } from "../Commands/use-commands";
import { TimeLapseButton } from "../TimeLapse/TimeLapseButton";
import { DOCK_BUTTON } from "./dock-button";
import { DockAction } from "./DockAction";
import { GoToMenu } from "./GoToMenu";

/** The Listen page's actions: go to a place, sweep, storm time-lapse, the tour, the Inspector, the keys (the mixer is on every page, in the dock). */
export function ListenActions() {
  const { state } = useAppState();
  const commands = useCommands();
  const t = useT();
  const explore = state.mode === "explore";
  return (
    <>
      {/* The tour drives the map itself, so its own controls step aside while it runs. */}
      {explore && (
        <>
          <GoToMenu />
          <DockAction icon={<Broadcast aria-hidden="true" />} full={t("sweep.play")} label={t("dock.short.sweep")} short={t("dock.short.sweep")} onClick={commands.playSweep} />
          <TimeLapseButton className={DOCK_BUTTON} />
          <DockAction icon={<Compass aria-hidden="true" />} full={t("tour.start")} label={t("dock.short.tour")} short={t("dock.short.tour")} onClick={() => commands.setMode("story")} />
        </>
      )}
      <DockAction
        icon={<Info aria-hidden="true" />}
        full={t("inspector.open")}
        label={t("dock.short.inspector")}
        short={t("dock.short.inspector")}
        aria-expanded={state.panelOpen}
        onClick={() => commands.openPanel(state.panel)}
      />
      <DockAction icon={<Keyboard aria-hidden="true" />} full={t("help.keys")} short={t("help.keys")} onClick={commands.openHelp} className="hidden lg:inline-flex" />
    </>
  );
}
