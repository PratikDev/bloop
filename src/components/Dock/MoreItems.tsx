"use client";

import { ChatCircleText, Disc, Drop, GridFour, ShieldCheck, SkipBack, SkipForward } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { FLAGS } from "@/lib/flags";
import { neighbour } from "@/lib/records";
import { PAGE_PATHS } from "@/router/modes";
import { useAppState, useT } from "../AppState/use-app-state";
import { BRAILLE_EXPLORER_ID } from "../BrailleExplorer";
import { setBrailleOpener } from "../BrailleExplorer/opener";
import { useCommands } from "../Commands/use-commands";
import { listenSheet, type ListenSheetId } from "../pages/Listen/listen-sheet-store";
import { openPlayerSheet } from "../Player/player-sheet-store";
import { useRecords } from "../Records/use-records";
import { MORE_ITEM, useMoreMenu } from "./PlayerMore";

/** Opens the Now playing sheet. Focus comes back to More, because this row closes with its menu. */
export function NowPlayingItem() {
  const { current } = useRecords();
  const { close, button } = useMoreMenu();
  const t = useT();
  if (!current) return null;
  return (
    <Button
      variant="ghost"
      aria-haspopup="dialog"
      onClick={() => {
        close();
        openPlayerSheet(button.current);
      }}
      className={MORE_ITEM}
    >
      <Disc aria-hidden="true" />
      {t("player.nowPlaying")}
    </Button>
  );
}

/** Previous and next record, inside the current group; they never change page. */
export function StepItems() {
  const { records, current, play } = useRecords();
  const t = useT();
  const before = current && neighbour(records, current, -1);
  const after = current && neighbour(records, current, 1);
  return (
    <>
      <Button variant="ghost" disabled={!before} onClick={() => before && play(before, { stay: true })} className={MORE_ITEM}>
        <SkipBack aria-hidden="true" weight="fill" />
        {t("player.previous")}
      </Button>
      <Button variant="ghost" disabled={!after} onClick={() => after && play(after, { stay: true })} className={MORE_ITEM}>
        <SkipForward aria-hidden="true" weight="fill" />
        {t("player.next")}
      </Button>
    </>
  );
}

/** Listen's extras: the braille explorer, Ask Bloop, Water's journey, Sources and checks, and the way to How we know. */
export function ListenItems() {
  const { state } = useAppState();
  const commands = useCommands();
  const { close, button } = useMoreMenu();
  const t = useT();
  // A sheet opened from here gives focus back to More: this row goes away with its menu.
  const openSheet = (id: ListenSheetId) => {
    close();
    listenSheet.open(id, button.current);
  };
  return (
    <>
      <Button
        variant="ghost"
        aria-expanded={state.brailleOpen}
        aria-controls={state.brailleOpen ? BRAILLE_EXPLORER_ID : undefined}
        onClick={() => {
          close();
          commands.toggleBraille();
          // Closing the explorer comes back to More (this item goes away with its menu).
          setBrailleOpener(button.current);
        }}
        className={MORE_ITEM}
      >
        <GridFour aria-hidden="true" />
        {t("braille.open")}
      </Button>
      {FLAGS.askBloop && (
        <Button variant="ghost" aria-haspopup="dialog" onClick={() => openSheet("ask")} className={MORE_ITEM}>
          <ChatCircleText aria-hidden="true" />
          {t("ask.open")}
        </Button>
      )}
      {FLAGS.artJourney && (
        <Button variant="ghost" aria-haspopup="dialog" onClick={() => openSheet("journey")} className={MORE_ITEM}>
          <Drop aria-hidden="true" />
          {t("journey.open")}
        </Button>
      )}
      <Button
        variant="ghost"
        onClick={() => {
          close();
          commands.openPanel(state.panel);
        }}
        className={MORE_ITEM}
      >
        <ShieldCheck aria-hidden="true" />
        {t("inspector.open")}
      </Button>
      <Link to={PAGE_PATHS.how} onClick={close} className="flex h-11 items-center rounded-lg px-3 text-body underline underline-offset-4 hover:bg-tide">
        {t("listen.howChecked")}
      </Link>
    </>
  );
}
