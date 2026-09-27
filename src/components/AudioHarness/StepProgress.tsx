import { Progress } from "@/components/ui/progress";
import { useStepPlayhead } from "./use-step-playhead";

interface StepProgressProps {
  player: string; // step-event player name, e.g. "sweep", "thenNow.water"
  describe?: (index: number) => string; // what data point the index is (year, month…)
}

/** A playhead bar driven only by one player's step events, shown when the audio clock reaches them. */
export default function StepProgress({ player, describe }: StepProgressProps) {
  const head = useStepPlayhead(player);
  const pct = head.total > 0 ? ((head.index + 1) / head.total) * 100 : 0;
  const at = head.index >= 0 && describe ? ` (${describe(head.index)})` : "";
  return (
    <div className="flex flex-col gap-1">
      <Progress value={pct} aria-label={`${player} playhead`} />
      <p className="font-mono text-xs text-muted-foreground">
        {player}: {head.index + 1}/{head.total}
        {at} · step events {head.events} · max display lag {head.maxLagMs.toFixed(0)} ms
      </p>
    </div>
  );
}
