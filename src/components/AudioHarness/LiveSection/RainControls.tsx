import { ChoiceGroup, type Choice } from "@/components/ChoiceGroup";
import { Button } from "@/components/ui/button";
import type { RainPhase } from "@/lib/audio";
import LabeledSlider from "../LabeledSlider";
import { formatLon, positionFromRain, rainForDropsPerSecond, rainFromPosition } from "./format";
import type { RainInput } from "./use-live-controls";

const PHASES: readonly Choice<RainPhase>[] = [
  { value: "dry", label: "Dry" },
  { value: "liquid", label: "Rain" },
  { value: "frozen", label: "Snow" },
  { value: "nodata", label: "No data" },
];

const PRESETS_DROPS_PER_SEC = [2, 5, 10, 20, 40];
const SLIDER_STEPS = 1000;

interface RainControlsProps {
  rain: RainInput;
  disabled: boolean;
  onChange: (patch: Partial<RainInput>) => void;
}

export default function RainControls({ rain, disabled, onChange }: RainControlsProps) {
  const wet = rain.phase === "liquid" || rain.phase === "frozen";
  return (
    <fieldset className="flex flex-col gap-3" disabled={disabled}>
      <legend className="mb-2 font-medium">Rain and snow</legend>
      <ChoiceGroup label="Rain phase" options={PHASES} value={rain.phase} onChange={(phase) => onChange({ phase })} />
      <LabeledSlider
        label="Rate (log scale)"
        value={Math.round(positionFromRain(rain.mmPerHour) * SLIDER_STEPS)}
        min={0}
        max={SLIDER_STEPS}
        disabled={disabled || !wet}
        format={() => `${rain.mmPerHour.toFixed(2)} mm/h`}
        onChange={(p) => onChange({ mmPerHour: rainFromPosition(p / SLIDER_STEPS) })}
      />
      <LabeledSlider
        label="Longitude (rain)"
        value={rain.lon}
        min={-180}
        max={180}
        disabled={disabled}
        format={formatLon}
        onChange={(lon) => onChange({ lon })}
      />
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Presets (T6):</span>
        {PRESETS_DROPS_PER_SEC.map((rate) => (
          <Button
            key={rate}
            size="sm"
            variant="outline"
            disabled={disabled || !wet}
            onClick={() => onChange({ mmPerHour: rainForDropsPerSecond(rate) })}
          >
            {rate} drops/s
          </Button>
        ))}
      </div>
    </fieldset>
  );
}
