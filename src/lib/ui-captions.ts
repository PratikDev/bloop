// Captions the UI raises itself, next to the sound engine's caption events:
// spoken lines (Enter, Story, Describe) and the end of Place History, which the
// engine's playSeries doesn't caption. Same shape as the engine's captions.
// onCaption() is the one place the caption bar and Describe mode listen to both.

import { audio } from "@/lib/audio-adapter";
import type { CaptionParams } from "@/lib/audio-adapter/types";

export interface CaptionEvent {
  key: string;
  params: CaptionParams;
}

type Listener = (e: CaptionEvent) => void;
const listeners = new Set<Listener>();

// A scrubbed month in Place History: the chart (a slider) already shows and
// announces it, so the engine's "Now playing: <month>" caption for it is left out.
const SIDE_CAPTION = "caption.compare.side";
let quietLabel: string | null = null;

export function postCaption(key: string, params: CaptionParams = {}): void {
  for (const cb of listeners) cb({ key, params });
}

function onUiCaption(cb: Listener): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** Leaves out the "Now playing" caption of the sound labelled `label` (null: leave none out). */
export function quietSideCaption(label: string | null): void {
  quietLabel = label;
}

/** Every caption, from the sound engine and from the UI. */
export function onCaption(cb: Listener): () => void {
  const offEngine = audio.onAudioEvent((e) => {
    if (e.kind !== "caption") return;
    if (e.key === SIDE_CAPTION && quietLabel !== null && e.params.label === quietLabel) return;
    cb({ key: e.key, params: e.params });
  });
  const offUi = onUiCaption(cb);
  return () => {
    offEngine();
    offUi();
  };
}
