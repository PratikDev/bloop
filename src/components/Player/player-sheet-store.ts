// The one way to open the "Now playing" sheet, from anywhere: the sleeve, a menu item, a key.

import { createSheetStore } from "@/lib/sheet-store";

const store = createSheetStore<true>();

/**
 * Opens the sheet. `from` is the control focus returns to when it closes; a menu item that
 * disappears with its menu should pass the button that opened the menu instead.
 */
export const openPlayerSheet = (from: HTMLElement | null = null): void => store.open(true, from);

export const closePlayerSheet = store.close;

/** The control to give focus back to. */
export const playerSheetOpener = store.opener;

export const usePlayerSheetOpen = (): boolean => store.useShown() === true;
