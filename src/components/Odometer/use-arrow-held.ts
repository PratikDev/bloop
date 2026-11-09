"use client";

import { useEffect } from "react";

const ARROWS = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"]);
const ATTRIBUTE = "arrowHeld";

let users = 0;

// A held key repeats: only then is the needle racing and the digits cut instead of rolling. CSS reads the attribute.
const down = (e: KeyboardEvent) => {
  if (e.repeat && ARROWS.has(e.key)) document.documentElement.dataset[ATTRIBUTE] = "true";
};
const up = (e: KeyboardEvent) => {
  if (ARROWS.has(e.key)) delete document.documentElement.dataset[ATTRIBUTE];
};

/** Marks `<html data-arrow-held>` while an arrow key is held; shared by every Odometer on the page. */
export function useArrowHeld(): void {
  useEffect(() => {
    if (users++ === 0) {
      window.addEventListener("keydown", down);
      window.addEventListener("keyup", up);
    }
    return () => {
      if (--users > 0) return;
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      delete document.documentElement.dataset[ATTRIBUTE];
    };
  }, []);
}
