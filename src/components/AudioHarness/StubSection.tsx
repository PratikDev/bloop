import { Button } from "@/components/ui/button";
import { playClip } from "@/lib/audio";
import HarnessSection from "./HarnessSection";

/** Later-phase API functions exist with their final signatures but only warn for now. */
export default function StubSection() {
  return (
    <HarnessSection
      title="Later-phase stubs"
      phase={1}
      description="Each should log a clear 'not implemented yet (Phase N)' warning in the browser console and do nothing else."
    >
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => void playClip("/audio/test.mp3")}>
          Call playClip (Phase 8)
        </Button>
      </div>
    </HarnessSection>
  );
}
