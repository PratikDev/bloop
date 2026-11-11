// Esc is global (stop all sound, close panels). A view can claim one Esc first
// for something smaller (close its search, stop its tour): the newest handler
// that returns true consumes the key and the global Esc doesn't run.

type EscapeHandler = () => boolean;
const handlers: EscapeHandler[] = [];

export function pushEscapeHandler(handler: EscapeHandler): () => void {
  handlers.push(handler);
  return () => {
    const i = handlers.lastIndexOf(handler);
    if (i !== -1) handlers.splice(i, 1);
  };
}

/** The open overlays (dialogs, sheets, popovers, menus, lists) whose own Esc closes them. */
const OVERLAY_SELECTOR = '[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"]';

/** Anything that can say whether it sits inside a selector (an Element; a stand-in in the unit test). */
interface Closest {
  closest(selectors: string): unknown;
}

/**
 * Whether this Esc closes an overlay: it was pressed inside one. That Esc still stops the sound, but it only closes the
 * overlay, never the page under it (on the Turntable, Esc in Credits left for Listen).
 */
export function escClosesOverlay(target: Closest | null): boolean {
  return target !== null && target.closest(OVERLAY_SELECTOR) !== null;
}

/** Offers Esc to the claimed handlers, newest first; true if one used it. */
export function consumeEscape(): boolean {
  for (let i = handlers.length - 1; i >= 0; i--) if (handlers[i]()) return true;
  return false;
}
