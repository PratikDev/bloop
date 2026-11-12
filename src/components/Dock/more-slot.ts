"use client";

import { useSyncExternalStore } from "react";

// A page can add rows to the player's More menu (Then vs Now's other ways to listen and its Details) without the
// player knowing about them: the menu publishes the element, the page portals into it.

let slot: HTMLElement | null = null;
const listeners = new Set<() => void>();

export function setMoreSlot(el: HTMLElement | null): void {
  slot = el;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useMoreSlot(): HTMLElement | null {
  return useSyncExternalStore(
    subscribe,
    () => slot,
    () => null,
  );
}
