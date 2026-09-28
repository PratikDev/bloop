"use client";

import { CartesianGrid, Line, LineChart, ReferenceArea, ReferenceLine, XAxis, YAxis } from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { AXIS, LegendItem, LineSwatch, unitLabel, ZERO_LINE_STROKE, ZeroLineKey } from "./chart-style";

export interface MonthlyPoint {
  i: number;
  month: string; // "YYYY-MM"
  [series: string]: number | string | null;
}

export interface ChartSeries {
  key: string;
  label: string;
  tone: "now" | "then"; // brighter = the one being played
}

export interface ChartSpan {
  from: number; // index
  to: number;
  kind: "window" | "gap" | "selected";
}

/**
 * A monthly record on an index axis (plan H3: chart + playhead): used for the
 * GRACE water record and for Place History. Missing months stay as breaks in
 * the line and are shaded; the playhead follows the sound.
 */
export function HistoryChart({
  rows,
  series,
  spans = [],
  unit,
  zeroLine,
  playheadIndex,
  summary,
  heightClass = "h-60",
}: {
  rows: MonthlyPoint[];
  series: ChartSeries[];
  spans?: ChartSpan[];
  unit: string;
  zeroLine?: string;
  playheadIndex: number | null;
  summary: string;
  heightClass?: string;
}) {
  const config = Object.fromEntries(
    series.map((s) => [s.key, { label: s.label, color: s.tone === "now" ? "var(--chart-now)" : "var(--chart-then)" }]),
  ) satisfies ChartConfig;
  const yearOf = (i: number) => rows[i]?.month.slice(0, 4) ?? "";
  const fill = { window: "var(--dusk)", gap: "var(--tide)", selected: "var(--tide)" } as const;

  return (
    <figure aria-label={summary} className="space-y-2">
      <ChartContainer config={config} className={`aspect-auto w-full ${heightClass}`}>
        <LineChart data={rows} margin={{ top: 8, right: 12, bottom: 4, left: 0 }} accessibilityLayer>
          {spans.map((s) => (
            <ReferenceArea key={`${s.kind}-${s.from}`} x1={s.from} x2={s.to} fill={fill[s.kind]} fillOpacity={s.kind === "gap" ? 0.9 : 0.8} ifOverflow="hidden" />
          ))}
          <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
          <XAxis dataKey="i" type="number" domain={["dataMin", "dataMax"]} tickFormatter={yearOf} minTickGap={24} {...AXIS} />
          <YAxis width={44} {...AXIS} label={unitLabel(unit)} />
          {zeroLine && <ReferenceLine y={0} stroke={ZERO_LINE_STROKE} />}
          {series.map((s) => (
            <Line
              key={s.key}
              dataKey={s.key}
              stroke={`var(--color-${s.key})`}
              strokeWidth={s.tone === "now" ? 1.5 : 1}
              strokeDasharray={s.tone === "then" ? "3 3" : undefined}
              dot={false}
              connectNulls={false}
              isAnimationActive={false}
            />
          ))}
          {playheadIndex !== null && <ReferenceLine x={playheadIndex} stroke="var(--shapla)" strokeWidth={2} />}
        </LineChart>
      </ChartContainer>
      <figcaption className="flex flex-wrap gap-x-5 gap-y-1 text-small text-haze">
        {series.map((s) => (
          <LegendItem key={s.key} swatch={<LineSwatch stroke={s.tone === "now" ? "var(--chart-now)" : "var(--chart-then)"} dashed={s.tone === "then"} />}>
            {s.label}
          </LegendItem>
        ))}
        {zeroLine && <ZeroLineKey label={zeroLine} />}
      </figcaption>
    </figure>
  );
}
