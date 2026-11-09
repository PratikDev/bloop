"use client";

import { useEffect, useRef, type RefObject } from "react";
import { useAppState } from "@/components/AppState/use-app-state";
import { createSpin, stepSpin } from "@/lib/spin";
import { subscribeTicker } from "./use-ticker";

/** Spins the element at 33⅓ rpm while `playing`, easing up and down. It stays where it is under reduced motion. */
export function useSpin(ref: RefObject<HTMLElement | SVGElement | null>, playing: boolean): void {
  const { state } = useAppState();
  const { reduceMotion } = state;
  const spinRef = useRef(createSpin());

  useEffect(() => {
    const el = ref.current;
    const spin = spinRef.current;
    if (!el || reduceMotion || (!playing && spin.velocity === 0)) return;
    const off = subscribeTicker((_, dt) => {
      stepSpin(spin, playing, dt / 1000);
      el.style.transform = `rotate(${spin.angle}rad)`;
      if (!playing && spin.velocity === 0) off();
    }, el);
    return off;
  }, [ref, playing, reduceMotion]);
}
