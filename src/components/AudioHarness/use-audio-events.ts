import { useEffect, useState } from "react";
import { onAudioEvent, type AudioEvent } from "@/lib/audio";

const MAX_EVENTS = 50;

export interface LoggedEvent {
  id: number;
  at: string; // wall-clock time, for reading the log
  event: AudioEvent;
}

/**
 * Subscribes to the engine's events. `revision` changes on every state event,
 * so components that read engine getters in render stay in sync.
 */
export function useAudioEvents() {
  const [events, setEvents] = useState<LoggedEvent[]>([]);
  const [ready, setReady] = useState(false);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let nextId = 0;
    return onAudioEvent((event) => {
      if (event.kind === "state") {
        setReady(event.ready);
        setRevision((r) => r + 1);
      }
      const logged = { id: nextId++, at: new Date().toLocaleTimeString(), event };
      setEvents((list) => [logged, ...list].slice(0, MAX_EVENTS));
    });
  }, []);

  return { events, ready, revision, clear: () => setEvents([]) };
}
