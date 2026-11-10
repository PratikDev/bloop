"use client";

import { Headphones, Playlist, Play, Stop } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAppState, useT } from "../AppState/use-app-state";
import { MORE_ITEM } from "../Dock/PlayerMore";
import type { Part, useThenNowPlayer } from "./use-then-now-player";

type Player = ReturnType<typeof useThenNowPlayer>;

/** The one coral action on the page: play this part, or stop it while anything plays (the same key, so focus stays on it). */
export function PlayPartButton({ part, player }: { part: Part; player: Player }) {
  const { state } = useAppState();
  const t = useT();
  const playing = player.soundingPart !== null;
  const Icon = playing ? Stop : Play;
  return (
    <Button disabled={!state.soundOn} onClick={() => (playing ? player.stop() : player.playPart(part))} className={cn("key border-navy h-11 gap-2 rounded-lg px-4 text-body text-moon", state.soundOn ? "bg-shapla hover:bg-shapla" : "bg-paper hover:bg-paper")}>
      <Icon aria-hidden="true" weight="fill" />
      {t(playing ? "thenNow.stop" : "thenNow.play")}
    </Button>
  );
}

/** The other ways to listen, and Stop, in the player's More. */
export function ListenMoreItems({ part, player }: { part: Part; player: Player }) {
  const { state } = useAppState();
  const t = useT();
  return (
    <>
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
