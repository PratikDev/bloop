"use client";

import { Headphones, Playlist, Play, Stop } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useAppState, useT } from "../AppState/use-app-state";
import { MORE_ITEM } from "../Dock/PlayerMore";
import type { Part, useThenNowPlayer } from "./use-then-now-player";

type Player = ReturnType<typeof useThenNowPlayer>;

/** The one coral action on the page: play this part. */
export function PlayPartButton({ part, player }: { part: Part; player: Player }) {
  const { state } = useAppState();
  const t = useT();
  return (
    <Button disabled={!state.soundOn} onClick={() => player.playPart(part)} className="key h-11 gap-2 rounded-lg bg-shapla px-4 text-body text-moon hover:bg-shapla">
      <Play aria-hidden="true" weight="fill" />
      {t("thenNow.play")}
    </Button>
  );
}

/** The other ways to listen, and Stop, in the player's More. */
export function ListenMoreItems({ part, player }: { part: Part; player: Player }) {
  const { state } = useAppState();
  const t = useT();
  return (
    <>
      <Button variant="ghost" onClick={player.stop} className={MORE_ITEM}>
        <Stop aria-hidden="true" />
        {t("thenNow.stop")}
      </Button>
      {part !== "water" && (
        <Button variant="ghost" disabled={!state.soundOn} onClick={() => player.playSplit(part)} className={MORE_ITEM}>
          <Headphones aria-hidden="true" />
          {t("thenNow.split")}
        </Button>
      )}
      <Button variant="ghost" disabled={!state.soundOn} onClick={() => player.playPart("all")} className={MORE_ITEM}>
        <Playlist aria-hidden="true" />
        {t("thenNow.playAll")}
      </Button>
      {!state.soundOn && <p className="px-3 text-small text-haze">{t("thenNow.soundOff")}</p>}
    </>
  );
}
