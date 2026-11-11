"use client";

import { CartesianGrid, ReferenceLine, Scatter, ScatterChart, XAxis, YAxis } from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { AXIS, LegendItem, LineSwatch } from "./chart-style";
import { useAxisFormat } from "./use-axis-format";

interface XY {
  x: number;
  y: number;
}

export function OneToOneChart({ points, xLabel, yLabel, lineLabel, log = false }: { points: readonly XY[]; xLabel: string; yLabel: string; lineLabel: string; log?: boolean }) {
  const axis = useAxisFormat();
  const values = points.flatMap((p) => [p.x, p.y]).filter((v) => !log || v > 0);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const domain: [number, number] = log ? [lo, hi] : [Math.floor(lo), Math.ceil(hi)];
  const config = { pairs: { label: yLabel, color: "var(--chart-now)" } } satisfies ChartConfig;
  const shown = log ? points.filter((p) => p.x > 0 && p.y > 0) : points;
  const scale = log ? ("log" as const) : ("linear" as const);
  return (
    <div className="space-y-1">
      <ChartContainer config={config} className="aspect-square h-44 w-full max-w-56">
        {}
        <ScatterChart accessibilityLayer={false} margin={{ top: 6, right: 8, bottom: 18, left: 0 }}>
          <CartesianGrid stroke="var(--line)" strokeOpacity={0.4} />
          <XAxis type="number" dataKey="x" domain={domain} scale={scale} {...AXIS} tickFormatter={axis.value} label={{ value: xLabel, position: "insideBottom", offset: -12, fill: "var(--haze)", fontSize: 12 }} />
          <YAxis type="number" dataKey="y" domain={domain} scale={scale} {...AXIS} tickFormatter={axis.value} width={36} />
          <ReferenceLine segment={[{ x: domain[0], y: domain[0] }, { x: domain[1], y: domain[1] }]} stroke="var(--haze)" strokeDasharray="4 3" ifOverflow="extendDomain" />
          <Scatter data={shown as XY[]} fill="var(--chart-now)" isAnimationActive={false} />
        </ScatterChart>
      </ChartContainer>
      <p className="flex flex-wrap gap-x-4 text-small text-haze">
        <LegendItem swatch={<span className="size-2 rounded-full bg-chart-now" />}>{yLabel}</LegendItem>
        <LegendItem swatch={<LineSwatch stroke="var(--haze)" dashed />}>{lineLabel}</LegendItem>
      </p>
    </div>
  );
}
