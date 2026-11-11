import { findModes } from "@/lib/audio/layers/chord/modes";
import { NAMED_BOXES, type NamedBox } from "@/lib/cv/boxes";
import { boxStats, type BoxStats } from "@/lib/cv/box-stats";
import { budgetFor } from "@/lib/cv/error-budget";
import { sstSource } from "@/lib/cv/read-source";
import type { SstField } from "@/lib/data";

export interface BoxView {
  box: NamedBox;
  stats: BoxStats;
  groups: ReturnType<typeof findModes>;
}

const sstSigma = () => budgetFor("ocean")?.error_in_axis_units ?? Number.NaN;

export function boxViews(sst: SstField): BoxView[] {
  const src = sstSource(sst, "SST");
  return NAMED_BOXES.map((box) => {
    const stats = boxStats(src.grid, box.bounds, src.axis);
    return { box, stats, groups: findModes(stats.values, sstSigma()) };
  }).filter((v) => v.stats.valid > 0);
}

export const centre = (b: NamedBox) => ({ lat: (b.bounds[1] + b.bounds[3]) / 2, lon: (b.bounds[0] + b.bounds[2]) / 2 });
