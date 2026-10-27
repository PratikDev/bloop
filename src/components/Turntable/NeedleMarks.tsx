"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Rect } from "./LabelLayer";
import { ReadoutCard } from "./ReadoutCard";
import type { Turntable } from "./use-turntable";

const CARD_GAP_PX = 28;
const EDGE_PX = 8;

/**
 * Follows the needle every frame: a crosshair in the close-up view, and the
 * readout card beside the needle (wide screens; phones show it under the globe).
 * The card's area is written to `reserved` so labels keep clear of it.
 */
export function NeedleMarks({ subscribe, place, reserved }: { subscribe: Turntable["subscribe"]; place: string | null; reserved: { current: Rect[] } }) {
  const crossRef = useRef<SVGSVGElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [now] = useState(Date.now);
  // The card's size, measured by a ResizeObserver: never read in the frame loop (that forces a layout).
  const cardSize = useRef({ w: 0, h: 0 });
  // Attached whenever the card element appears (it renders nothing until data loads).
  const observeCard = useCallback((card: HTMLDivElement | null) => {
    cardRef.current = card;
    if (!card) return;
    const observer = new ResizeObserver(([entry]) => {
      const box = entry.borderBoxSize[0];
      cardSize.current = { w: box?.inlineSize ?? 0, h: box?.blockSize ?? 0 };
    });
    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  useEffect(
    () =>
      subscribe((f) => {
        const cross = crossRef.current;
        if (cross) {
          cross.style.transform = `translate(${Math.round(f.needle.x - 20)}px, ${Math.round(f.needle.y - 20)}px)`;
          cross.style.opacity = String(Math.max(0, (f.blend - 0.4) / 0.6));
        }
        const card = cardRef.current;
        const { w, h } = cardSize.current;
        if (!card || w === 0) {
          reserved.current = [];
          return;
        }
        const right = f.needle.x + CARD_GAP_PX + w + EDGE_PX <= f.width;
        const x = Math.max(EDGE_PX, right ? f.needle.x + CARD_GAP_PX : f.needle.x - CARD_GAP_PX - w);
        const y = Math.min(f.height - h - EDGE_PX, Math.max(EDGE_PX, f.needle.y - h / 2));
        card.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
        reserved.current = [{ x, y, w, h }];
      }),
    [subscribe, reserved],
  );

  return (
    <>
      <svg ref={crossRef} aria-hidden="true" viewBox="0 0 40 40" className="pointer-events-none absolute top-0 left-0 size-10 text-shapla">
        <circle cx="20" cy="20" r="11" fill="none" stroke="currentColor" strokeWidth="2.5" />
        <path d="M20 2v10M20 28v10M2 20h10M28 20h10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="20" cy="20" r="2" fill="currentColor" />
      </svg>
      <ReadoutCard ref={observeCard} place={place} now={now} className="pointer-events-none absolute top-0 left-0 hidden md:block" />
    </>
  );
}
