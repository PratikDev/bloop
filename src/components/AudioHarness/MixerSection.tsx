import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { VOICE_IDS, setAllMuted, setMasterVolume, setSolo, stopAll, type VoiceId } from "@/lib/audio";
import HarnessSection from "./HarnessSection";
import LabeledSlider from "./LabeledSlider";
import { usePeakMeter } from "./use-peak-meter";

type SoloValue = VoiceId | "none";

const SOLO_ITEMS: Record<SoloValue, string> = {
  none: "No solo",
  ...(Object.fromEntries(VOICE_IDS.map((id) => [id, id])) as Record<VoiceId, string>),
};

const formatDb = (db: number) => (Number.isFinite(db) ? `${db.toFixed(1)} dBFS` : "silent");

interface MixerSectionProps {
  ready: boolean;
}

export default function MixerSection({ ready }: MixerSectionProps) {
  const [volume, setVolume] = useState(100);
  const [muted, setMuted] = useState(false);
  const [solo, setSoloValue] = useState<SoloValue>("none");
  const { peakDb, maxDb, resetMax } = usePeakMeter(ready);
  const muteId = useId();

  return (
    <HarnessSection
      title="Mixer and stop"
      phase={1}
      description="Volume is capped by the gain budget: at 100 % the peak must stay below 0 dBFS. Stop (or Esc) fades everything out in about 50 ms."
    >
      <LabeledSlider
        label="Master volume"
        value={volume}
        min={0}
        max={100}
        format={(v) => `${v} %`}
        onChange={(v) => {
          setVolume(v);
          setMasterVolume(v / 100);
        }}
      />
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2">
          <Switch
            id={muteId}
            checked={muted}
            onCheckedChange={(checked) => {
              setMuted(checked);
              setAllMuted(checked);
            }}
          />
          <Label htmlFor={muteId}>Mute all</Label>
        </div>
        <Select
          items={SOLO_ITEMS}
          value={solo}
          onValueChange={(value) => {
            const next = (value ?? "none") as SoloValue;
            setSoloValue(next);
            setSolo(next === "none" ? null : next);
          }}
        >
          <SelectTrigger aria-label="Solo voice">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(SOLO_ITEMS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="destructive" onClick={stopAll}>
          Stop all (Esc)
        </Button>
      </div>
      <div className="flex items-center gap-3 font-mono text-sm text-muted-foreground">
        <span>peak {formatDb(peakDb)}</span>
        <span className={maxDb >= 0 ? "text-destructive" : undefined}>max {formatDb(maxDb)}</span>
        <Button size="xs" variant="ghost" onClick={resetMax}>
          reset
        </Button>
      </div>
    </HarnessSection>
  );
}
