import type { AudioEvent, CaptionParams } from "./types";

type Listener = (e: AudioEvent) => void;

const listeners = new Set<Listener>();

export function onAudioEvent(cb: Listener): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function emit(e: AudioEvent): void {
  for (const cb of listeners) cb(e);
}

export function emitCaption(key: string, params: CaptionParams = {}): void {
  emit({ kind: "caption", key, params });
}
