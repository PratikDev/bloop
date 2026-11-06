import { useState } from "react";
import type { CompareSide, ThenNowInput } from "@/lib/audio";
import { loadDemo, loadGistemp, loadGrace } from "@/lib/data";
import { buildThenNowInput } from "@/lib/then-now";
import { SYNTHETIC } from "./synthetic";

const DECADE_MONTHS = 120;

export interface DemoInput {
  source: "synthetic" | "real";
  input: ThenNowInput;
  series: CompareSide; // one decade of monthly heat for playSeries
}

const heatSeries = (label: string, values: number[]): CompareSide => ({ label, values, voice: "heat" });

const SYNTHETIC_INPUT: DemoInput = {
  source: "synthetic",
  input: SYNTHETIC,
  series: heatSeries(SYNTHETIC.heat.B.label, SYNTHETIC.heat.B.values),
};

/**
 * The harness's Then vs Now input: synthetic until "Load real demo", then the
 * real files through L3's own loaders and buildThenNowInput() (no second
 * adapter; agreed with L3 on PR #4).
 */
export function useDemoInput() {
  const [demo, setDemo] = useState<DemoInput>(SYNTHETIC_INPUT);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadReal = async () => {
    setLoading(true);
    setError(null);
    try {
      const [demoFile, grace, gistemp] = await Promise.all([loadDemo(), loadGrace(), loadGistemp()]);
      const dhaka = gistemp.cells.Dhaka;
      const from = Math.max(0, dhaka.months.length - DECADE_MONTHS);
      const label = `Dhaka ${dhaka.months[from]} – ${dhaka.months[dhaka.months.length - 1]} (GISTEMP)`;
      setDemo({
        source: "real",
        input: buildThenNowInput(demoFile, grace),
        series: heatSeries(label, dhaka.anom_C.slice(from)),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return { demo, error, loading, loadReal, useSynthetic: () => setDemo(SYNTHETIC_INPUT) };
}

/** Heat window A vs B as comparison sides. */
export const heatSides = (input: ThenNowInput): [CompareSide, CompareSide] => [
  heatSeries(input.heat.A.label, input.heat.A.values),
  heatSeries(input.heat.B.label, input.heat.B.values),
];
