"use client";

import { useEffect, useRef } from "react";
import { EASE_MECHANICAL } from "@/lib/motion";
import { useAppState } from "../AppState/use-app-state";

const REST = "rotate(-28deg)";
const ON = "rotate(0deg)";
const EASE = `cubic-bezier(${EASE_MECHANICAL.join(", ")})`;
/** Motion item 1: 500 ms onto the record with a two-step settle, 400 ms off it. */
const DROP_MS = 500;
const LIFT_MS = 400;

/**
 * The crown's decorative tonearm: it swings onto the record when the record starts sounding and lifts when it stops.
 * Interruptible (each change starts from where the arm is); instant with Reduce motion and on first paint.
 */
export function Tonearm({ on }: { on: boolean }) {
  const { state } = useAppState();
  const arm = useRef<SVGSVGElement>(null);
  const painted = useRef(false);

  useEffect(() => {
    const el = arm.current;
    if (!el) return;
    const to = on ? ON : REST;
    const from = getComputedStyle(el).transform;
    el.getAnimations().forEach((a) => a.cancel());
    el.style.transform = to;
    if (!painted.current || state.reduceMotion) {
      painted.current = true;
      return;
    }
    const frames = on
      ? [{ transform: from }, { transform: "rotate(3deg)", offset: 0.7 }, { transform: "rotate(-1deg)", offset: 0.86 }, { transform: ON }]
      : [{ transform: from }, { transform: REST }];
    el.animate(frames, { duration: on ? DROP_MS : LIFT_MS, easing: EASE });
  }, [on, state.reduceMotion]);

  return (
    <svg
      ref={arm}
      aria-hidden="true"
      viewBox="0 0 32 32"
      style={{ transform: REST, transformOrigin: "26px 6px" }}
      className="pointer-events-none absolute top-0.5 right-2 size-8 sm:right-4"
    >
      <circle cx="26" cy="6" r="4" className="fill-paper stroke-navy" strokeWidth="2" />
      <path d="M26 6 L12 24" className="stroke-navy" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="7" y="22" width="8" height="6" rx="1.5" transform="rotate(-35 11 25)" className="fill-paper stroke-navy" strokeWidth="2" />
    </svg>
  );
}
