"use client";

import { useEffect, useRef, useState } from "react";
import { DURATION, EASE_MECHANICAL } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useAppState } from "./AppState/use-app-state";

const HALF_MS = (DURATION.flip * 1000) / 2;
const EASE = `cubic-bezier(${EASE_MECHANICAL.join(", ")})`;

/**
 * Text that changes like a split-flap card (motion item 2): it folds away to −90°, the text swaps, and it folds back,
 * 280 ms in all. A change mid-flip starts again from where the card is. Instant with Reduce motion.
 */
export function SplitFlap({ text, className }: { text: string; className?: string }) {
  const { state } = useAppState();
  const card = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(text);
  const folded = useRef(false);

  // Fold away, then swap the text.
  useEffect(() => {
    if (text === shown) return;
    const el = card.current;
    if (!el || state.reduceMotion) {
      const id = requestAnimationFrame(() => setShown(text));
      return () => cancelAnimationFrame(id);
    }
    const fold = el.animate([{ transform: getComputedStyle(el).transform }, { transform: "rotateX(-90deg)" }], { duration: HALF_MS, easing: "ease-in", fill: "forwards" });
    fold.onfinish = () => {
      folded.current = true;
      setShown(text);
    };
    return () => fold.cancel();
  }, [text, shown, state.reduceMotion]);

  // Then fold back with the new text.
  useEffect(() => {
    const el = card.current;
    if (!el || !folded.current) return;
    folded.current = false;
    el.getAnimations().forEach((a) => a.cancel());
    el.animate([{ transform: "rotateX(-90deg)" }, { transform: "rotateX(0deg)" }], { duration: HALF_MS, easing: EASE });
  }, [shown]);

  return (
    <span ref={card} className={cn("inline-block origin-center", className)}>
      {shown}
    </span>
  );
}
