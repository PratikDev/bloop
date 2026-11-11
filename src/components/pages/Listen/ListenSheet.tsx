"use client";

import { FLAGS } from "@/lib/flags";
import { useT } from "../../AppState/use-app-state";
import { JourneyPanel } from "../../Art/Journey";
import { AskBloop } from "../../AskBloop";
import { SideSheet } from "../../SideSheet";
import { listenSheet } from "./listen-sheet-store";

/** Ask Bloop and Water's journey, each in a sheet beside the map so Listen stays one screen. Mounted once on Listen. */
export function ListenSheet() {
  const t = useT();
  const shown = listenSheet.useShown();
  if (!FLAGS.askBloop && !FLAGS.artJourney) return null;
  return (
    <SideSheet open={shown !== null} onClose={listenSheet.close} title={t(shown === "journey" ? "journey.open" : "ask.title")} opener={listenSheet.opener}>
      {shown === "ask" && <AskBloop />}
      {shown === "journey" && <JourneyPanel onClose={listenSheet.close} />}
    </SideSheet>
  );
}
