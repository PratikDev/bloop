"use client";

import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { localDigits } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { sharedYScale, windowLabel, type ChartScale, type YearRow } from "@/lib/then-now";
import type { DemoWindow } from "@/types/data-contract";
import { useAppState } from "../AppState/use-app-state";
import { PanelPlayhead, PanelStripes, PanelYear } from "../ThenNow/MotionStage/PanelMotion";
import { LegendItem, PANEL_AXIS, PANEL_AXIS_FONT_PX, PANEL_AXIS_WIDTH, PANEL_CHART_HEIGHT, PANEL_MARGIN, PANEL_X_PADDING, unitLabel, ZERO_LINE_STROKE, ZeroLineKey } from "./chart-style";
import { useAxisFormat } from "./use-axis-format";

type Side = "then" | "now";

// "Then" is hollow, "now" filled: shape tells them apart, not colour alone.
const DOTS = {
  then: { r: 3.5, fill: "var(--night)", strokeWidth: 1.5 },
  now: { r: 3.5, fill: "var(--color-now)" },
} as const satisfies Record<Side, object>;

/** The motion drawn with a panel: stripes behind the line and a playhead that moves on the audio clock. */
export interface PanelMotionProps {
  part: "heat" | "monsoon";
  baseline: number;
  /** Years up to this one are filled; null: nothing is playing, all are. */
  playedThrough: { then: number | null; now: number | null };
  /** The year sounding (one window at a time), for the panel that holds it. */
  sounding: number | null;
  /** Both windows at once: each panel's own year. */
  splitYear: { then: number | null; now: number | null };
  paused: boolean;
}

interface PanelProps {
  side: Side;
  win: DemoWindow;
  rows: YearRow[];
  config: ChartConfig;
  unit: string;
  scale: ChartScale;
  zeroLine: boolean;
  motion: PanelMotionProps;
  nA: number;
  nB: number;
  heightClass: string;
}

/** One window as a comic panel: its years in a caption box, its own line and mean, the axis both panels share. */
function WindowPanel({ side, win, rows, config, unit, scale, zeroLine, motion, nA, nB, heightClass }: PanelProps) {
  const { state } = useAppState();
  const axis = useAxisFormat();
  const [from, to] = win.window;
  return (
    <div className="comic-panel min-w-0 space-y-2">
      <div className="flex min-h-9 items-center justify-between gap-2">
        <p className="comic-box w-fit rounded-caption px-2 py-0.5 text-body">{localDigits(windowLabel(win), state.lang)}</p>
        <PanelYear year={motion.sounding !== null && motion.sounding >= from && motion.sounding <= to ? motion.sounding : motion.splitYear[side]} paused={motion.paused} />
      </div>
      <div className="relative">
        <PanelStripes win={win} baseline={motion.baseline} playedThrough={motion.playedThrough[side]} />
      <ChartContainer config={config} className={cn("relative aspect-auto w-full", heightClass)}>
        <LineChart data={rows.filter((r) => r[side] !== null)} margin={PANEL_MARGIN} accessibilityLayer>
          <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
          <XAxis dataKey="year" type="number" domain={[from, to]} ticks={win.years} padding={{ left: PANEL_X_PADDING, right: PANEL_X_PADDING }} allowDecimals={false} interval="preserveStartEnd" minTickGap={20} tickFormatter={axis.year} {...PANEL_AXIS} />
          <YAxis width={PANEL_AXIS_WIDTH} domain={scale.domain} ticks={scale.ticks} tickFormatter={axis.value} {...PANEL_AXIS} label={unitLabel(unit, PANEL_AXIS_FONT_PX)} />
          {zeroLine && <ReferenceLine y={0} stroke={ZERO_LINE_STROKE} />}
          <ReferenceLine
            segment={[
              { x: from, y: win.mean },
              { x: to, y: win.mean },
            ]}
            stroke={`var(--color-${side})`}
            strokeDasharray="4 4"
          />
          <Line dataKey={side} stroke={`var(--color-${side})`} strokeWidth={1.5} dot={DOTS[side]} connectNulls={false} isAnimationActive={false} />
        </LineChart>
      </ChartContainer>
        <PanelPlayhead side={side} nA={nA} nB={nB} part={motion.part} paused={motion.paused} />
      </div>
    </div>
  );
}

/**
 * Then vs Now for one yearly part: the two windows as two comic panels on the same y-axis (stacked, "Then" on top,
 * under 640 px), each window's mean as a dashed line (numbers from the JSON), the years as stripes behind the line, and a playhead at the year that is sounding.
 */
export function YearlyChart({
  rows,
  pair,
  labels,
  unit,
  zeroLine,
  motion,
  summary,
  heightClass = PANEL_CHART_HEIGHT,
}: {
  rows: YearRow[];
  pair: { A: DemoWindow; B: DemoWindow };
  labels: { then: string; now: string };
  unit: string;
  zeroLine?: string; // e.g. "1951–1980 normal" for anomalies
  motion: PanelMotionProps;
  summary: string; // text alternative for the whole chart
  heightClass?: string;
}) {
  const config = {
    then: { label: labels.then, color: "var(--chart-then)" },
    now: { label: labels.now, color: "var(--chart-now)" },
  } satisfies ChartConfig;
  const scale = sharedYScale([...pair.A.values, ...pair.B.values, pair.A.mean, pair.B.mean]);
  const panel = { rows, config, unit, scale, zeroLine: zeroLine !== undefined, motion, nA: pair.A.years.length, nB: pair.B.years.length, heightClass };

  return (
    <figure aria-label={summary} className="space-y-2">
      <div className="grid gap-4 sm:grid-cols-2">
        <WindowPanel side="then" win={pair.A} {...panel} />
        <WindowPanel side="now" win={pair.B} {...panel} />
      </div>
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
