import { ChoiceGroup, type Choice } from "@/components/ChoiceGroup";
import { Button } from "@/components/ui/button";
import { silenceLive, type TrackMode } from "@/lib/audio";
import HarnessSection from "../HarnessSection";
import LiveReadout from "./LiveReadout";
import OceanControls from "./OceanControls";
import RainControls from "./RainControls";
import { useLiveControls } from "./use-live-controls";
import { useLiveStats } from "./use-live-stats";
import { useRandomWalk } from "./use-random-walk";

const MODES: readonly Choice<TrackMode>[] = [
  { value: "ocean", label: "Ocean" },
  { value: "rain", label: "Rain" },
  { value: "both", label: "Both" },
];

interface LiveSectionProps {
  ready: boolean;
}

/** Phase 2: the live voices, driven by sliders in place of L3's map cursor. */
export default function LiveSection({ ready }: LiveSectionProps) {
  const { ocean, rain, mode, oceanRef, updateOcean, updateRain, changeMode } = useLiveControls();
  const walk = useRandomWalk(oceanRef, updateOcean);
  const { stats, reset } = useLiveStats();
  const disabled = !ready;

  return (
    <HarnessSection
      title="Live voices"
      phase={2}
      description="Moving any control plays the voices, as the map cursor will. Ocean: pitch follows °C; rain: drops per second follow mm/h; snow: bells. Silence means no data; entering no data plays one soft tick."
    >
      <div className="flex flex-wrap items-center gap-4">
        <ChoiceGroup label="Track mode" options={MODES} value={mode} onChange={changeMode} />
        <Button variant="secondary" disabled={disabled} onClick={silenceLive}>
          Silence live voices
        </Button>
      </div>
      <OceanControls
        ocean={ocean}
        disabled={disabled}
        walking={walk.running}
        onChange={updateOcean}
        onRandomWalk={walk.start}
      />
      <RainControls rain={rain} disabled={disabled} onChange={updateRain} />
      <LiveReadout ocean={ocean} rain={rain} stats={stats} onResetStats={reset} />
    </HarnessSection>
  );
}
