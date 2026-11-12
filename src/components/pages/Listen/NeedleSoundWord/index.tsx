"use client";

import { toXY } from "@/lib/geo";
import { useAppState } from "../../../AppState/use-app-state";
import { SoundWord } from "../../../SoundWord";
import { useNeedleSoundWord } from "./use-needle-sound-word";

// Past this share of the map's width the word sits to the needle's left, so it isn't cut off at the edge.
const FLIP_FROM_PERCENT = 75;
const EDGE_PERCENT = 8; // keeps the word inside the map's top and bottom

/**
 * The sound word beside the needle, in a data-overlay box exactly over the 2:1 map, hidden from assistive tech.
 */
export function NeedleSoundWord() {
  const { state } = useAppState();
  const word = useNeedleSoundWord();
  if (!word || !state.soundWords) return null;
  const { x, y } = toXY(word.at, 100, 100);
  const flip = x > FLIP_FROM_PERCENT;
  const top = `${Math.min(100 - EDGE_PERCENT, Math.max(EDGE_PERCENT, y))}%`;
  return (
    <div data-overlay aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-(--layer-map-plates) aspect-2/1 overflow-hidden">
      <SoundWord
        key={word.key}
        id={word.id}
        size="map"
        pop={!state.reduceMotion}
        className={flip ? "absolute mr-5 -translate-y-1/2" : "absolute ml-5 -translate-y-1/2"}
        style={flip ? { right: `${100 - x}%`, top } : { left: `${x}%`, top }}
      />
    </div>
  );
}
