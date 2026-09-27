// PURE: a tiny event emitter for AudioEvent (captions, playhead steps, state).
// A throwing listener never breaks audio or other listeners.

import type { AudioEvent, AudioEventListener } from "./types";

export function createEmitter() {
  const listeners = new Set<AudioEventListener>();
  return {
    emit(event: AudioEvent) {
      for (const listener of listeners) {
        try {
          listener(event);
        } catch (err) {
          console.error("audio event listener failed", err);
        }
      }
    },
    /** Returns an unsubscribe function. */
    subscribe(listener: AudioEventListener): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

const emitter = createEmitter();

export const emit = emitter.emit;
export const onAudioEvent = emitter.subscribe;
