"use client";

import { GridFour } from "@phosphor-icons/react";
import { useAppState, useT } from "../AppState/use-app-state";
import { BRAILLE_EXPLORER_ID } from "../BrailleExplorer";
import { useCommands } from "../Commands/use-commands";
import { DockAction } from "./DockAction";

/** The key only the map has: the braille explorer. (Sweep, the storm and the tour are records now: D3, D2, D1.) */
export function ListenActions() {
  const { state } = useAppState();
  const commands = useCommands();
  const t = useT();
  return (
    <DockAction
      icon={<GridFour aria-hidden="true" />}
      full={t("braille.open")}
      short={t("braille.bl.braille")}
      aria-expanded={state.brailleOpen}
      aria-controls={state.brailleOpen ? BRAILLE_EXPLORER_ID : undefined}
      onClick={() => commands.toggleBraille()}
    />
  );
}
