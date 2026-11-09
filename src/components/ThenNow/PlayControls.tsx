"use client";

import { Headphones, ListPlus, Playlist, Play, Stop } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAppState, useT } from "../AppState/use-app-state";
import type { Part, useThenNowPlayer } from "./use-then-now-player";

const ACTION = "h-11 w-full justify-start gap-2 rounded-lg px-3 text-body lg:pointer-fine:h-9";
const SECONDARY = `${ACTION} key bg-paper font-normal text-moon hover:bg-paper`;

/** The Listen card: one coral Play for this part, Stop, and the other ways to listen in a menu. */
export function PlayControls({ part, player }: { part: Part; player: ReturnType<typeof useThenNowPlayer> }) {
  const { state } = useAppState();
  const t = useT();
  return (
    <div className="space-y-2.5">
      <Button disabled={!state.soundOn} onClick={() => player.playPart(part)} className={`${ACTION} key bg-shapla text-moon hover:bg-shapla`}>
        <Play aria-hidden="true" weight="fill" />
        {t("thenNow.play")}
      </Button>
      <Popover>
        <PopoverTrigger render={<Button variant="ghost" className={SECONDARY} />}>
          <ListPlus aria-hidden="true" />
          {t("thenNow.moreWays")}
        </PopoverTrigger>
        <PopoverContent align="end" className="surface-glass w-72 gap-2 rounded-plate p-3 text-body">
          {part !== "water" && (
            <Button variant="ghost" disabled={!state.soundOn} onClick={() => player.playSplit(part)} className={ACTION}>
              <Headphones aria-hidden="true" />
              {t("thenNow.split")}
            </Button>
          )}
          <Button variant="ghost" disabled={!state.soundOn} onClick={() => player.playPart("all")} className={ACTION}>
            <Playlist aria-hidden="true" />
            {t("thenNow.playAll")}
          </Button>
        </PopoverContent>
      </Popover>
      <Button variant="ghost" onClick={player.stop} className={SECONDARY}>
        <Stop aria-hidden="true" />
        {t("thenNow.stop")}
      </Button>
      {!state.soundOn && <p className="pt-1 text-small text-haze">{t("thenNow.soundOff")}</p>}
    </div>
  );
}
