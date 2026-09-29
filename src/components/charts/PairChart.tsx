"use client";

import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import type { PairRow, SeriesPair } from "@/lib/field-records";
import { AXIS, LegendItem, LineSwatch, unitLabel } from "./chart-style";

/**
 * Two periods on one shared axis (position in the season or window), each
 * with its mean as a dashed line when the file gives one. Used for the
 * comparisons that have no sound yet (fires, vegetation), so no playhead.
 */
export function PairChart({
  rows,
  pair,
  labels,
  unit,
  tick,
  summary,
}: {
  rows: PairRow[];
  pair: SeriesPair;
  labels: { then: string; now: string };
  unit: string;
  /** Axis label for a position, e.g. "1 Mar". */
  tick: (i: number) => string;
  summary: string; // text alternative for the whole chart
}) {
  const config = {
    then: { label: labels.then, color: "var(--chart-then)" },
    now: { label: labels.now, color: "var(--chart-now)" },
  } satisfies ChartConfig;
  const last = rows.length - 1;

  return (
    <figure aria-label={summary} className="space-y-2">
      <ChartContainer config={config} className="aspect-auto h-60 w-full">
        <LineChart data={rows} margin={{ top: 8, right: 16, bottom: 4, left: 0 }} accessibilityLayer>
          <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
          <XAxis dataKey="i" type="number" domain={[0, last]} tickFormatter={tick} minTickGap={32} {...AXIS} />
          <YAxis width={44} {...AXIS} label={unitLabel(unit)} />
          {pair.then.mean !== null && <ReferenceLine segment={[{ x: 0, y: pair.then.mean }, { x: last, y: pair.then.mean }]} stroke="var(--color-then)" strokeDasharray="4 4" />}
          {pair.now.mean !== null && <ReferenceLine segment={[{ x: 0, y: pair.now.mean }, { x: last, y: pair.now.mean }]} stroke="var(--color-now)" strokeDasharray="4 4" />}
          <Line dataKey="then" stroke="var(--color-then)" strokeWidth={1} strokeDasharray="3 3" dot={false} connectNulls={false} isAnimationActive={false} />
          <Line dataKey="now" stroke="var(--color-now)" strokeWidth={1.5} dot={false} connectNulls={false} isAnimationActive={false} />
        </LineChart>
      </ChartContainer>
      <figcaption className="flex flex-wrap gap-x-5 gap-y-1 text-small text-haze">
        <LegendItem swatch={<LineSwatch stroke="var(--chart-then)" dashed />}>{labels.then}</LegendItem>
        <LegendItem swatch={<LineSwatch stroke="var(--chart-now)" />}>{labels.now}</LegendItem>
      </figcaption>
    </figure>
  );
}
