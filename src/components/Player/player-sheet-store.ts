// The one way to open the "Now playing" sheet, from anywhere: the sleeve, a menu item, a key.

import { useSyncExternalStore } from "react";

let open = false;
let opener: HTMLElement | null = null;
const listeners = new Set<() => void>();

const notify = () => listeners.forEach((listener) => listener());

/**
 * Opens the sheet. `from` is the control focus returns to when it closes; a menu item that
 * disappears with its menu should pass the button that opened the menu instead.
 */
export function openPlayerSheet(from: HTMLElement | null = null): void {
  opener = from;
  open = true;
  notify();
}

export function closePlayerSheet(): void {
  open = false;
  notify();
}

/** The control to give focus back to. */
export const playerSheetOpener = (): HTMLElement | null => opener;

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function usePlayerSheetOpen(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => open,
    () => false,
  );
}
