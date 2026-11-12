"use client";

import { useCallback } from "react";

/** The CSS variable on <html> that holds the dock's height (globals.css keeps that much room under scrolled-to content). */
const DOCK_HEIGHT_VAR = "--dock-h";
/** Set on <html> when the dock is too tall to stay on screen (large text wraps it): it then sits at the page's end. */
const DOCK_TALL_ATTR = "data-dock-tall";
/** The share of the screen's height a sticky dock may take (design choice, WCAG 1.4.10's note on sticky content). */
const MAX_SHARE = 0.25;

/** The dock's height in CSS pixels (0 when there is no dock). */
export const dockHeight = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue(DOCK_HEIGHT_VAR)) || 0;

/** The room the dock takes at the screen's foot while it sticks there (none once it is tall and sits at the page's end). */
export const stickyDockHeight = () => (document.documentElement.hasAttribute(DOCK_TALL_ATTR) ? 0 : dockHeight());

/**
 * A ref for the sound dock that publishes its height as --dock-h, so a page that scrolls (the low-vision layouts) never
 * brings focus or the needle's map to rest under the sticky dock; and, when large text makes the dock taller than a
 * quarter of the screen, marks it to stop sticking, so it never covers the page. Removed when the dock goes.
 */
export function useDockHeight() {
  return useCallback((el: HTMLElement | null) => {
    if (!el) return;
    const root = document.documentElement;
    const measure = () => {
      root.style.setProperty(DOCK_HEIGHT_VAR, `${el.offsetHeight}px`);
      root.toggleAttribute(DOCK_TALL_ATTR, el.offsetHeight > window.innerHeight * MAX_SHARE);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
      root.style.removeProperty(DOCK_HEIGHT_VAR);
      root.removeAttribute(DOCK_TALL_ATTR);
    };
  }, []);
}
