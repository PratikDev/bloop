"use client";

import { useCallback } from "react";

const DOCK_HEIGHT_VAR = "--dock-h";
const DOCK_TALL_ATTR = "data-dock-tall";
const MAX_SHARE = 0.25;

export const dockHeight = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue(DOCK_HEIGHT_VAR)) || 0;

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
