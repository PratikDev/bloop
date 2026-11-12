import { useSyncExternalStore } from "react";

/**
 * A sheet's open state, reachable from anywhere (a menu item, a key, a sleeve). `T` is what the sheet shows; null is
 * closed. The store remembers the control focus returns to when the sheet closes.
 */
export function createSheetStore<T>() {
  let shown: T | null = null;
  let opener: HTMLElement | null = null;
  const listeners = new Set<() => void>();
  const set = (value: T | null) => {
    shown = value;
    listeners.forEach((listener) => listener());
  };
  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };
  return {
    /** `from` gets focus back on close; a menu item that disappears with its menu passes the button that opened the menu. */
    open(value: T, from: HTMLElement | null = null): void {
      opener = from;
      set(value);
    },
    close: (): void => set(null),
    opener: (): HTMLElement | null => opener,
    useShown: (): T | null =>
      useSyncExternalStore(
        subscribe,
        () => shown,
        () => null,
      ),
  };
}
