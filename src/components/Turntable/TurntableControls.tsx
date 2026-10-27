"use client";

import { Map as MapIcon, Minus, Pause, Play, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "../AppState/use-app-state";
import { SPEEDS } from "./use-turntable";

const BAR_BUTTON = "h-11 gap-2 px-3 text-body";

/** Turn / stop, speed, and the way back to the flat map: every key has a button. */
export function TurntableControls({
  rotating,
  speed,
  onToggleRotation,
  onChangeSpeed,
  onFlatMap,
}: {
  rotating: boolean;
  speed: number;
  onToggleRotation: () => void;
  onChangeSpeed: (step: 1 | -1) => void;
  onFlatMap: () => void;
}) {
  const t = useT();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="secondary" onClick={onToggleRotation} className={BAR_BUTTON}>
        {rotating ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
        {t(rotating ? "turntable.stopTurning" : "turntable.turn")}
      </Button>
      <Button
        variant="ghost"
        size="icon-lg"
        onClick={() => onChangeSpeed(-1)}
        disabled={speed === SPEEDS[0]}
        aria-label={t("turntable.slower")}
        className="size-11"
      >
        <Minus aria-hidden="true" />
      </Button>
      <span className="min-w-24 text-center text-body tabular-nums">{t("turntable.speed", { speed })}</span>
      <Button
        variant="ghost"
        size="icon-lg"
        onClick={() => onChangeSpeed(1)}
        disabled={speed === SPEEDS[SPEEDS.length - 1]}
        aria-label={t("turntable.faster")}
        className="size-11"
      >
        <Plus aria-hidden="true" />
      </Button>
      <Button variant="outline" onClick={onFlatMap} className={`${BAR_BUTTON} ml-auto`}>
        <MapIcon aria-hidden="true" />
        {t("turntable.flatMap")}
      </Button>
    </div>
  );
}
