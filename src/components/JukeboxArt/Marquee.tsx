"use client";

import { useRef } from "react";
import { useWordmarkWidth } from "@/hooks/use-wordmark-width";
import { WINDOW } from "./parts";

const LONG = 8;
const LONG_WIDTH = 300;

/** The name on the arch. With `reactive`, its width follows the sound (only ever one wordmark at a time). */
export function Marquee({ text, reactive }: { text: string; reactive: boolean }) {
  const ref = useRef<SVGTextElement>(null);
  useWordmarkWidth(ref, reactive);
  const long = text.length > LONG;
  return (
    <text
      ref={ref}
      data-marquee
      x={WINDOW.cx}
      y="124"
      textAnchor="middle"
      fontSize={long ? 34 : 62}
      textLength={long ? LONG_WIDTH : undefined}
      lengthAdjust="spacingAndGlyphs"
      className="notranslate fill-navy font-wide"
    >
      {text}
    </text>
  );
}
