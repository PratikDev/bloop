"use client";

import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import type { YearRow } from "@/lib/then-now";
import type { DemoWindow } from "@/types/data-contract";
import { AXIS, CHART_HEIGHT, LegendItem, unitLabel, ZERO_LINE_STROKE, ZeroLineKey } from "./chart-style";

/**
 * Then vs Now for one yearly part: the two windows on one time axis, each
 * window's mean as a dashed line (numbers from the JSON), and a playhead at
 * the year that is sounding.
 */
export function YearlyChart({
  rows,
  pair,
  labels,
  unit,
  zeroLine,
  playheadYears,
  summary,
  heightClass = CHART_HEIGHT,
}: {
  rows: YearRow[];
  pair: { A: DemoWindow; B: DemoWindow };
  labels: { then: string; now: string };
  unit: string;
  zeroLine?: string; // e.g. "1951–1980 normal" for anomalies
  playheadYears: number[]; // one, or two when both windows play at once
  summary: string; // text alternative for the whole chart
  heightClass?: string;
}) {
  const config = {
    then: { label: labels.then, color: "var(--chart-then)" },
    now: { label: labels.now, color: "var(--chart-now)" },
  } satisfies ChartConfig;
  const mean = (w: DemoWindow, key: "then" | "now") => (
    <ReferenceLine
      segment={[
        { x: w.window[0], y: w.mean },
        { x: w.window[1], y: w.mean },
      ]}
      stroke={`var(--color-${key})`}
      strokeDasharray="4 4"
    />
  );

  return (
    <figure aria-label={summary} className="space-y-2">
      <ChartContainer config={config} className={cn("aspect-auto w-full", heightClass)}>
        <LineChart data={rows} margin={{ top: 8, right: 16, bottom: 4, left: 0 }} accessibilityLayer>
          <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
          <XAxis dataKey="year" type="number" domain={["dataMin", "dataMax"]} allowDecimals={false} {...AXIS} />
          <YAxis width={44} {...AXIS} label={unitLabel(unit)} />
          {zeroLine && <ReferenceLine y={0} stroke={ZERO_LINE_STROKE} />}
          {mean(pair.A, "then")}
          {mean(pair.B, "now")}
          <Line dataKey="then" stroke="var(--color-then)" strokeWidth={1.5} dot={{ r: 3.5, fill: "var(--night)", strokeWidth: 1.5 }} connectNulls={false} isAnimationActive={false} />
          <Line dataKey="now" stroke="var(--color-now)" strokeWidth={1.5} dot={{ r: 3.5, fill: "var(--color-now)" }} connectNulls={false} isAnimationActive={false} />
          {playheadYears.map((year) => (
            <ReferenceLine key={year} x={year} stroke="var(--shapla)" strokeWidth={2} />
          ))}
        </LineChart>
      </ChartContainer>
      <figcaption className="flex flex-wrap gap-x-5 gap-y-1 text-small text-haze">
        <LegendItem
          swatch={
            <svg viewBox="0 0 10 10" className="size-2.5" aria-hidden="true">
              <circle cx="5" cy="5" r="3.5" fill="none" stroke="var(--chart-then)" strokeWidth="1.5" />
            </svg>
          }
        >
          {labels.then}
        </LegendItem>
        <LegendItem
          swatch={
            <svg viewBox="0 0 10 10" className="size-2.5" aria-hidden="true">
              <circle cx="5" cy="5" r="4" fill="var(--chart-now)" />
            </svg>
          }
        >
          {labels.now}
        </LegendItem>
        {zeroLine && <ZeroLineKey label={zeroLine} />}
      </figcaption>
    </figure>
  );
}
