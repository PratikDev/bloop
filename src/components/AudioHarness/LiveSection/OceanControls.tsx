import { useId } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import LabeledSlider from "../LabeledSlider";
import { formatLon } from "./format";
import type { OceanInput } from "./use-live-controls";

interface OceanControlsProps {
  ocean: OceanInput;
  disabled: boolean;
  walking: boolean;
  onChange: (patch: Partial<OceanInput>) => void;
  onRandomWalk: () => void;
}

export default function OceanControls({ ocean, disabled, walking, onChange, onRandomWalk }: OceanControlsProps) {
  const noDataId = useId();
  return (
    <fieldset className="flex flex-col gap-3" disabled={disabled}>
      <legend className="mb-2 font-medium">Ocean</legend>
      <LabeledSlider
        label="Temperature"
        value={ocean.valueC}
        min={-5}
        max={35}
        step={0.1}
        disabled={disabled}
        format={(v) => `${v.toFixed(1)} °C`}
        onChange={(valueC) => onChange({ valueC, noData: false })}
      />
      <LabeledSlider
        label="Longitude (ocean)"
        value={ocean.lon}
        min={-180}
        max={180}
        disabled={disabled}
        format={formatLon}
        onChange={(lon) => onChange({ lon })}
      />
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Switch
            id={noDataId}
            checked={ocean.noData}
            disabled={disabled}
            onCheckedChange={(noData) => onChange({ noData })}
          />
          <Label htmlFor={noDataId}>No data (land)</Label>
        </div>
        <Button
          variant="outline"
          disabled={disabled}
          onClick={() => onChange({ noData: false, valueC: ocean.valueC === 0 ? 30 : 0 })}
        >
          Jump 0 ↔ 30 °C (T1)
        </Button>
        <Button variant="outline" disabled={disabled || walking} onClick={onRandomWalk}>
          {walking ? "Walking…" : "Random walk 10 s"}
        </Button>
      </div>
    </fieldset>
  );
}
