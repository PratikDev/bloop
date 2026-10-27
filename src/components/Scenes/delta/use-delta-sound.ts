"use client";

import { useEffect, useRef, useState } from "react";
import { audio } from "@/lib/audio-adapter";
import type { PlayerHandle, RainPhase } from "@/lib/audio-adapter/types";
import type { LatLon } from "@/lib/data";
import type { GraceBoxName, GraceContextFile } from "@/types/data-contract";
import { useSceneTrack } from "../use-scene-track";

export interface DeltaSound {
  playing: boolean;
  /** The box the GRACE playback is on (null when not playing). */
  playingBox: GraceBoxName | null;
  toggle(): void;
}

/**
 * The delta's sound: the live rain voice for the IMERG frame under the needle
 * (re-set on every frame), a neutral pluck when the needle reaches a river, and
 * on Play both GRACE boxes on the water voice's one fixed range, Bangladesh
 * first, missing months as soft ticks. Step events move the month.
 */
export function useDeltaSound(o: {
  grace: GraceContextFile;
  needle: LatLon;
  rain: { mmPerHour: number | null; phase: RainPhase } | null;
  river: string | null;
  boxLabels: Record<GraceBoxName, string>;
  onMonth(index: number): void;
}): DeltaSound {
  useSceneTrack("rain");
  const [playingBox, setPlayingBox] = useState<GraceBoxName | null>(null);
  const player = useRef<PlayerHandle | null>(null);
  const onMonth = useRef(o.onMonth);
  useEffect(() => {
    onMonth.current = o.onMonth;
  });
  useEffect(() => () => player.current?.stop(), []);

  const mm = o.rain?.mmPerHour ?? null;
  const phase = o.rain?.phase ?? "nodata";
  const { lon } = o.needle;
  useEffect(() => {
    audio.setRain(mm, phase, lon);
  }, [mm, phase, lon]);

  useEffect(() => {
    if (o.river) audio.playEarcon("ping", { lon: o.needle.lon });
    // Pluck on arriving at a river, not while moving along it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [o.river]);

  const n = o.grace.boxes.Bangladesh.months.length;
  useEffect(
    () =>
      audio.onAudioEvent((e) => {
        if (e.kind !== "step" || e.player !== "compare" || !player.current) return;
        setPlayingBox(e.index < n ? "Bangladesh" : "NW_India");
        onMonth.current(e.index % n);
      }),
    [n],
  );

  const toggle = () => {
    if (player.current) {
      player.current.stop();
      return;
    }
    const side = (name: GraceBoxName) => {
      const box = o.grace.boxes[name];
      return { label: o.boxLabels[name], values: box.cm, months: box.months, voice: "water" as const, gapTexture: true };
    };
    const handle = audio.playCompare(side("Bangladesh"), side("NW_India"), "sequential");
    player.current = handle;
    setPlayingBox("Bangladesh");
    void handle.done.then(() => {
      if (player.current === handle) player.current = null;
      setPlayingBox(null);
    });
  };

  return { playing: playingBox !== null, playingBox, toggle };
}
