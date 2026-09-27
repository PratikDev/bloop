import { useId } from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface LabeledSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  disabled?: boolean;
  format: (value: number) => string;
  onChange: (value: number) => void;
}

/** A single-thumb slider with its label and current value shown. */
export default function LabeledSlider({ label, value, min, max, step = 1, disabled, format, onChange }: LabeledSliderProps) {
  const id = useId();
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-sm">
        <Label id={id}>{label}</Label>
        <span className="font-mono text-muted-foreground">{format(value)}</span>
      </div>
      <Slider
        aria-labelledby={id}
        value={[value]}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onValueChange={(v) => onChange(Array.isArray(v) ? v[0] : v)}
      />
    </div>
  );
}
