"use client";

import { Headphones, Playlist, Play, Stop } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useAppState, useT } from "../AppState/use-app-state";
import type { Part, useThenNowPlayer } from "./use-then-now-player";

const ACTION = "h-11 w-full justify-start gap-2 rounded-lg px-3 text-body lg:pointer-fine:h-9";

/**
 * The Listen card: this part first (the main action), then "then left, now
 * right" (heat and monsoon), the three sounded parts in turn, and Stop.
 */
export function PlayControls({ part, player }: { part: Part; player: ReturnType<typeof useThenNowPlayer> }) {
  const { state } = useAppState();
  const t = useT();
  return (
    <div className="space-y-1.5">
      <Button disabled={!state.soundOn} onClick={() => player.playPart(part)} className={`${ACTION} bg-shapla text-ink hover:bg-shapla/90`}>
        <Play aria-hidden="true" weight="fill" />
        {t("thenNow.play")}
      </Button>
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
      <Button variant="ghost" onClick={player.stop} className={ACTION}>
        <Stop aria-hidden="true" />
        {t("thenNow.stop")}
      </Button>
      {!state.soundOn && <p className="pt-1 text-small text-haze">{t("thenNow.soundOff")}</p>}
    </div>
  );
}
