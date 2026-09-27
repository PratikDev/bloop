import { Button } from "@/components/ui/button";
import HarnessSection from "./HarnessSection";
import type { LoggedEvent } from "./use-audio-events";

interface EventLogProps {
  events: LoggedEvent[];
  onClear: () => void;
}

/** The last 50 AudioEvents, newest first — what L3 will receive for captions and playheads. */
export default function EventLog({ events, onClear }: EventLogProps) {
  return (
    <HarnessSection title="Event log" phase={1} description="Every AudioEvent the engine emits, newest first (drop events are counted in the live section instead).">
      <Button className="self-start" size="sm" variant="ghost" onClick={onClear}>
        Clear log
      </Button>
      <ol aria-live="polite" className="max-h-64 overflow-y-auto font-mono text-xs text-muted-foreground">
        {events.length === 0 && <li>No events yet.</li>}
        {events.map(({ id, at, event }) => (
          <li key={id}>
            {at} {JSON.stringify(event)}
          </li>
        ))}
      </ol>
    </HarnessSection>
  );
}
