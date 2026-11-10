"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { followPlayhead } from "@/hooks/use-playhead";
import { localDigits } from "@/lib/i18n";
import { panelPosition } from "@/lib/then-now";
import { cn } from "@/lib/utils";
import type { DemoWindow } from "@/types/data-contract";
import { useAppState } from "../../AppState/use-app-state";
import { PANEL_PLOT_INSET } from "../../charts/chart-style";
import { Odometer } from "../../Odometer";
import { useHeld } from "./use-held";

const plot: CSSProperties = { left: PANEL_PLOT_INSET.left, right: PANEL_PLOT_INSET.right, top: PANEL_PLOT_INSET.top, bottom: PANEL_PLOT_INSET.bottom };

/** One stripe per year behind a panel's line, filled as the playhead passes: bubble above the baseline, dial below, a paper outline until played. */
export function PanelStripes({ win, baseline, playedThrough }: { win: DemoWindow; baseline: number; playedThrough: number | null }) {
  const n = win.years.length;
  return (
    <div aria-hidden="true" className="pointer-events-none absolute" style={plot}>
      {win.years.map((year, i) => {
        // Stripes meet halfway between years; the first and last are half-width at the plot's edge.
        const left = i === 0 ? 0 : ((i - 0.5) / (n - 1)) * 100;
        const right = i === n - 1 ? 100 : ((i + 0.5) / (n - 1)) * 100;
        const value = win.values[i];
        const played = playedThrough === null || year <= playedThrough;
        return (
          <div key={year} data-stripe className="absolute inset-y-0 border border-navy/25 bg-paper" style={{ left: `${left}%`, width: `${right - left}%` }}>
            {value !== null && <div className={cn("stripe-fill size-full", value >= baseline ? "bg-bubble" : "bg-dial")} data-stripe-fill={value >= baseline ? "above" : "below"} data-played={played || undefined} />}
          </div>
        );
      })}
    </div>
  );
}

/** The year sounding in this panel, on its header. Held while motion is paused; the sound goes on. Decorative: the captions and the chart carry it. */
export function PanelYear({ year, paused }: { year: number | null; paused: boolean }) {
  const { state } = useAppState();
  const shown = useHeld(year, paused);
  if (year === null || shown === null) return null;
  return <Odometer value={localDigits(String(shown), state.lang)} className="font-wide text-title text-moon" />;
}

/** The playhead line, moving continuously between years on the audio clock (in steps under reduced motion). */
export function PanelPlayhead({ side, nA, nB, part, paused }: { side: "then" | "now"; nA: number; nB: number; part: "heat" | "monsoon"; paused: boolean }) {
  const { state } = useAppState();
  const line = useRef<HTMLDivElement>(null);
  const latest = useRef({ paused, discrete: state.reduceMotion });
  useEffect(() => {
    latest.current = { paused, discrete: state.reduceMotion };
  });

  useEffect(() => {
    const el = line.current;
    if (!el) return;
    const place = (split: boolean, position: number | null) => {
      if (latest.current.paused) return;
      const share = position === null ? null : panelPosition(latest.current.discrete ? Math.floor(position) : position, side, nA, nB, split);
      el.style.opacity = share === null ? "0" : "1";
      if (share !== null) el.style.transform = `translateX(${(share * 100).toFixed(2)}%)`;
    };
    // Hidden when neither player has a step sounding.
    const sounding = { whole: false, split: false };
    const follow = (prefix: string, key: keyof typeof sounding) =>
      followPlayhead(
        prefix,
        (step, stepSec, now) => {
          sounding[key] = step !== null;
          if (step) place(key === "split", step.index + (stepSec ? Math.min(1, (now - step.time) / stepSec) : 0));
          else if (!sounding.whole && !sounding.split && !latest.current.paused) el.style.opacity = "0";
        },
        el,
      );
    const offs = [follow(`thenNow.${part}`, "whole"), follow("compare.split", "split")];
    return () => offs.forEach((off) => off());
  }, [side, nA, nB, part]);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute overflow-hidden" style={plot}>
      <div ref={line} data-playhead className="absolute inset-y-0 left-0 w-full border-l-2 border-shapla opacity-0" />
    </div>
  );
}
