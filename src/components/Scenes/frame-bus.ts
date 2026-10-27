// A tiny per-frame publish/subscribe: the scene publishes after each update,
// HTML overlays (the chip, labels) position themselves without React renders.

export interface FrameBus<T> {
  subscribe(fn: (frame: T) => void): () => void;
  publish(frame: T): void;
}

export function createFrameBus<T>(): FrameBus<T> {
  const subscribers = new Set<(frame: T) => void>();
  return {
    subscribe(fn) {
      subscribers.add(fn);
      return () => {
        subscribers.delete(fn);
      };
    },
    publish(frame) {
      for (const fn of subscribers) fn(frame);
    },
  };
}
