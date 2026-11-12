"use client";

import { useEffect, useRef, type RefObject } from "react";

/** Called once per animation frame: `now` is the rAF timestamp (ms), `dt` the time since the last frame (ms, capped). */
export type TickFn = (now: number, dt: number) => void;

interface Subscriber {
  fn: TickFn;
  /** False while its element is off-screen: the ticker skips it. */
  visible: boolean;
}

/** A long gap (a dropped frame, a tab coming back) counts as one ordinary frame, so nothing jumps. */
const MAX_DT_MS = 100;
const FIRST_DT_MS = 1000 / 60;

const subscribers = new Set<Subscriber>();
let frame = 0;
let last = 0;
let listening = false;

function loop(now: number): void {
  frame = 0;
  if (document.hidden) return;
  const dt = last === 0 ? FIRST_DT_MS : Math.min(now - last, MAX_DT_MS);
  last = now;
  for (const s of subscribers) if (s.visible) s.fn(now, dt);
  schedule();
}

function schedule(): void {
  if (frame === 0 && subscribers.size > 0 && !document.hidden) frame = requestAnimationFrame(loop);
}

function onVisibility(): void {
  if (document.hidden) {
    cancelAnimationFrame(frame);
    frame = 0;
  } else {
    last = 0;
    schedule();
  }
}

/**
 * The app's one requestAnimationFrame loop (WebGL scenes keep their own). It pauses while the tab is hidden; with a
 * `target`, the subscriber also pauses while that element is off-screen. Returns the unsubscribe function.
 */
export function subscribeTicker(fn: TickFn, target?: Element | null): () => void {
  const sub: Subscriber = { fn, visible: true };
  subscribers.add(sub);
  if (!listening) {
    document.addEventListener("visibilitychange", onVisibility);
    listening = true;
  }
  let observer: IntersectionObserver | null = null;
  if (target && typeof IntersectionObserver !== "undefined") {
    observer = new IntersectionObserver((entries) => {
      for (const e of entries) sub.visible = e.isIntersecting;
      if (sub.visible) schedule();
    });
    observer.observe(target);
  }
  schedule();
  return () => {
    subscribers.delete(sub);
    observer?.disconnect();
    if (subscribers.size === 0) {
      cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
    }
  };
}

/** Subscribes `fn` to the shared ticker while `enabled`. `fn` may change every render without resubscribing. */
export function useTicker(fn: TickFn, options: { target?: RefObject<Element | null>; enabled?: boolean } = {}): void {
  const { target, enabled = true } = options;
  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  });
  useEffect(() => {
    if (!enabled) return;
    return subscribeTicker((now, dt) => fnRef.current(now, dt), target?.current);
  }, [enabled, target]);
}
