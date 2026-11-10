"use client";

import { useCallback, type KeyboardEvent } from "react";

/** The attribute that marks one stop in a roving group. */
export const ROVING_ITEM = "data-roving-item";

const NEXT = new Set(["ArrowDown", "ArrowRight"]);
const PREVIOUS = new Set(["ArrowUp", "ArrowLeft"]);

/**
 * Arrow keys, Home and End inside a group that is one Tab stop (roving tabindex): the caller gives the item it wants
 * reachable by Tab `tabIndex={0}` and the rest `-1`, and follows focus to keep that in step. Put the handler on the
 * group's container and `data-roving-item` on each item.
 */
export function useRovingFocus(): (e: KeyboardEvent<HTMLElement>) => void {
  return useCallback((e: KeyboardEvent<HTMLElement>) => {
    if (!NEXT.has(e.key) && !PREVIOUS.has(e.key) && e.key !== "Home" && e.key !== "End") return;
    const items = [...e.currentTarget.querySelectorAll<HTMLElement>(`[${ROVING_ITEM}]`)];
    const at = items.indexOf(document.activeElement as HTMLElement);
    if (at < 0 || items.length === 0) return;
    const to = e.key === "Home" ? 0 : e.key === "End" ? items.length - 1 : NEXT.has(e.key) ? Math.min(at + 1, items.length - 1) : Math.max(at - 1, 0);
    e.preventDefault();
    items[to].focus();
    items[to].scrollIntoView({ block: "nearest" });
  }, []);
}
