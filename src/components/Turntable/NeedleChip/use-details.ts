"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** The card closes this long after the last interaction (unless pinned or focused). */
const AUTO_COLLAPSE_MS = 4000;

export interface Details {
  open: boolean;
  pinned: boolean;
  /** Opens the card (hover, focus, I, Enter) and restarts the collapse timer. */
  show(): void;
  hide(): void;
  toggle(): void;
  setPinned(on: boolean): void;
  /** Pointer or focus inside the card: no collapse while it lasts. */
  hold(on: boolean): void;
}

function chipClick(open: boolean, byTheWay: boolean): "open" | "close" {
  return open && !byTheWay ? "close" : "open";
}

export function useDetails(): Details {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const holding = useRef(false);
  const byTheWay = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  const schedule = useCallback(() => {
    clear();
    timer.current = setTimeout(() => {
      if (!holding.current) setOpen(false);
    }, AUTO_COLLAPSE_MS);
  }, []);

  useEffect(() => clear, []);
  useEffect(() => {
    if (open && !pinned) schedule();
    else clear();
  }, [open, pinned, schedule]);

  return {
    open: open || pinned,
    pinned,
    show() {
      if (!open && !pinned) byTheWay.current = true;
      setOpen(true);
      if (!pinned) schedule();
    },
    hide() {
      byTheWay.current = false;
      setOpen(false);
      setPinned(false);
    },
    toggle() {
      const next = chipClick(open || pinned, byTheWay.current);
      byTheWay.current = false;
      if (next === "close") {
        setOpen(false);
        setPinned(false);
      } else setOpen(true);
    },
    setPinned,
    hold(on) {
      holding.current = on;
      if (!on && !pinned) schedule();
    },
  };
}
