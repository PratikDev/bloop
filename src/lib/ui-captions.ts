// Captions the UI raises itself, next to the sound engine's caption events:
// spoken lines (Enter, Story, Describe) and the end of Place History, which the
// engine's playSeries doesn't caption. Same shape as the engine's captions.

import type { CaptionParams } from "@/lib/audio-adapter/types";

export interface CaptionEvent {
  key: string;
  params: CaptionParams;
}

type Listener = (e: CaptionEvent) => void;
const listeners = new Set<Listener>();

export function postCaption(key: string, params: CaptionParams = {}): void {
  for (const cb of listeners) cb({ key, params });
}

export function onUiCaption(cb: Listener): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
