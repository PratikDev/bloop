"use client";

import { useEffect, useRef } from "react";
import { subscribeTicker } from "@/hooks/use-ticker";

const MAX_PER_SECOND = 3;
/** The share of the tube's height a bubble rises each second, at the slowest and the fastest value. */
const MIN_RISE = 0.2;
const RISE_RANGE = 0.6;
/** A fixed pattern, so the same bubbles appear on the server and the client: width in px, position across the tube in %. */
const BUBBLES = [
  { size: 6, left: 30 },
  { size: 4, left: 60 },
  { size: 8, left: 22 },
  { size: 5, left: 52 },
  { size: 7, left: 36 },
  { size: 4, left: 28 },
  { size: 6, left: 56 },
  { size: 5, left: 40 },
] as const;

/**
 * Flat paper bubbles rising inside a tube's fill: `speed` (0 to 1) sets how fast, `perSecond` how many (at most 3).
 * They stay inside the filled part (`level`, 0 to 1) and only run while `running`. Decorative.
 */
export function TubeBubbles({ level, speed, perSecond, running }: { level: number; speed: number; perSecond: number; running: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const live = useRef({ level, speed, perSecond });

  useEffect(() => {
    live.current = { level, speed, perSecond };
  }, [level, speed, perSecond]);

  useEffect(() => {
    const parent = box.current;
    if (!parent) return;
    const items = [...parent.children].filter((c): c is HTMLElement => c instanceof HTMLElement);
    const hide = () => items.forEach((el) => (el.style.opacity = "0"));
    hide();
    if (!running) return;
    const heights: (number | null)[] = items.map(() => null);
    let sinceLast = Infinity;
    const off = subscribeTicker((_, dt) => {
      const now = live.current;
      sinceLast += dt;
      const rate = Math.min(now.perSecond, MAX_PER_SECOND);
      if (rate > 0 && sinceLast >= 1000 / rate) {
        const free = heights.indexOf(null);
        if (free !== -1) {
          heights[free] = 0;
          sinceLast = 0;
        }
      }
      const rise = ((MIN_RISE + RISE_RANGE * now.speed) * dt) / 1000;
      const tall = parent.clientHeight;
      heights.forEach((height, i) => {
        if (height === null) return;
        const next = height + rise;
        const gone = next >= now.level;
        heights[i] = gone ? null : next;
        items[i].style.opacity = gone ? "0" : "1";
        items[i].style.transform = `translateY(${-next * tall}px)`;
      });
    }, parent);
    return () => {
      off();
      hide();
    };
  }, [running]);

  return (
    <div ref={box} aria-hidden="true" className="absolute inset-0">
      {BUBBLES.map(({ size, left }, i) => (
        <span key={i} style={{ width: size, height: size, left: `${left}%`, opacity: 0 }} className="absolute bottom-1 rounded-full border-[1.5px] border-navy bg-paper" />
      ))}
    </div>
  );
}
