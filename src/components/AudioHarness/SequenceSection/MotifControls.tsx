import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { playMotif } from "@/lib/audio";

const BANDS = ["60°S–30°S", "30°S–0°", "0°–30°N", "30°N–60°N"];
const DEFAULTS = [10, 25, 28, 15];

interface MotifControlsProps {
  disabled: boolean;
}

/** Four hand-typed band means (°C), each can be a rest (no ocean data), played south → north. */
export default function MotifControls({ disabled }: MotifControlsProps) {
  const [values, setValues] = useState(DEFAULTS);
  const [rests, setRests] = useState([false, false, false, false]);

  const update = <T,>(list: T[], i: number, v: T) => list.map((x, j) => (j === i ? v : x));

  return (
    <fieldset className="flex flex-col gap-3" disabled={disabled}>
      <legend className="mb-2 font-medium">Motif</legend>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {BANDS.map((band, i) => (
          <div key={band} className="flex flex-col gap-1">
            <Label htmlFor={`motif-${i}`}>{band} (°C)</Label>
            <Input
              id={`motif-${i}`}
              type="number"
              step="0.1"
              value={values[i]}
              disabled={disabled || rests[i]}
              onChange={(e) => setValues(update(values, i, Number(e.target.value)))}
            />
            <Label className="flex items-center gap-2 text-sm">
              <Switch checked={rests[i]} onCheckedChange={(on) => setRests(update(rests, i, on))} />
              No data (rest)
            </Label>
          </div>
        ))}
      </div>
      <Button className="self-start" variant="outline" disabled={disabled} onClick={() => playMotif(values.map((v, i) => (rests[i] ? null : v)))}>
        Play motif
      </Button>
    </fieldset>
  );
}
