import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { speak } from "@/lib/audio";
import { setDuckingEnabled } from "@/lib/audio/dev";

const COUNT = 10;
const GAP_MS = 700;

const randomValue = () => Math.round(Math.random() * 350) / 10; // 0.0 .. 35.0, test phrases only
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface DuckingTestProps {
  ready: boolean;
}

/** Ear test T2: speak 10 random values over the live voices, with ducking on or off, then reveal them. */
export default function DuckingTest({ ready }: DuckingTestProps) {
  const [ducking, setDucking] = useState(true);
  const [running, setRunning] = useState(false);
  const [values, setValues] = useState<number[]>([]);
  const [revealed, setRevealed] = useState(false);
  const switchId = useId();

  const run = async () => {
    const list = Array.from({ length: COUNT }, randomValue);
    setValues(list);
    setRevealed(false);
    setRunning(true);
    for (const v of list) {
      await speak(`${v.toFixed(1)} degrees`, "en");
      await sleep(GAP_MS);
    }
    setRunning(false);
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-muted-foreground">
        T2: start ocean + rain in the Live voices card first. Write down what you hear, then reveal. Pass: 10 of 10
        understood with ducking on.
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Switch
            id={switchId}
            checked={ducking}
            onCheckedChange={(on) => {
              setDucking(on);
              setDuckingEnabled(on);
            }}
          />
          <Label htmlFor={switchId}>Ducking</Label>
        </div>
        <Button variant="outline" disabled={!ready || running} onClick={() => void run()}>
          {running ? "Speaking…" : `Speak ${COUNT} random values`}
        </Button>
        <Button variant="ghost" size="sm" disabled={running || values.length === 0} onClick={() => setRevealed(true)}>
          Reveal
        </Button>
      </div>
      {revealed && <p className="font-mono text-sm text-muted-foreground">{values.map((v) => v.toFixed(1)).join(" · ")}</p>}
    </div>
  );
}
