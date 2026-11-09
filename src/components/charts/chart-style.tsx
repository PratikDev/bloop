// Shared chart styling: axis text at the plan's smallest step (design-plan
// §3.2, −1 = 12.8 px) and the legend entries under each chart.

import type { ReactNode } from "react";

const AXIS_FONT_PX = 12.8;

/** Chart height on the pages that fit one screen: grows with the screen, within reason (a little less on short laptops). */
export const CHART_HEIGHT = "h-[clamp(9rem,28dvh,21rem)] lg:short:h-[clamp(8rem,24dvh,18rem)]";

/** A panel's plot: shorter than CHART_HEIGHT, because the panel's frame and caption box take the rest of its height. */
export const PANEL_CHART_HEIGHT = "h-48 lg:short:h-40";

/** Where a panel's plot area sits inside its chart: the margins, the y-axis and the padding below (the stripes and playhead line up with it). */
export const PANEL_AXIS_WIDTH = 44;
export const PANEL_MARGIN = { top: 8, right: 16, bottom: 4, left: 0 };
export const PANEL_X_PADDING = 8;
const X_AXIS_HEIGHT = 30;
export const PANEL_PLOT_INSET = {
  left: PANEL_MARGIN.left + PANEL_AXIS_WIDTH + PANEL_X_PADDING,
  right: PANEL_MARGIN.right + PANEL_X_PADDING,
  top: PANEL_MARGIN.top,
  bottom: PANEL_MARGIN.bottom + X_AXIS_HEIGHT,
};

/** Then vs Now's comic panels hold the 14 px minimum. */
export const PANEL_AXIS_FONT_PX = 14;

export const AXIS = { stroke: "var(--line)", tick: { fill: "var(--haze)", fontSize: AXIS_FONT_PX, fontFamily: "var(--font-mono)" } };

export const PANEL_AXIS = { ...AXIS, tick: { ...AXIS.tick, fontSize: PANEL_AXIS_FONT_PX } };

/** The unit, written up the y-axis. */
export const unitLabel = (unit: string, fontSize = AXIS_FONT_PX) => ({ value: unit, angle: -90, position: "insideLeft" as const, fill: "var(--haze)", fontSize });

export const ZERO_LINE_STROKE = "var(--line)";

/** One legend entry: a small swatch and its label. */
export function LegendItem({ swatch, children }: { swatch: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2">
      {swatch}
      {children}
    </span>
  );
}

/** A short line swatch (a series, or the zero line). */
export function LineSwatch({ stroke, dashed = false }: { stroke: string; dashed?: boolean }) {
  return (
    <svg viewBox="0 0 16 4" className="h-1 w-4" aria-hidden="true">
      <line x1="0" y1="2" x2="16" y2="2" stroke={stroke} strokeWidth="2" strokeDasharray={dashed ? "3 3" : undefined} />
    </svg>
  );
}

/** The zero line's label lives in the legend, never on the line where it would cover data. */
export function ZeroLineKey({ label }: { label: string }) {
  return <LegendItem swatch={<LineSwatch stroke={ZERO_LINE_STROKE} />}>{label}</LegendItem>;
}
