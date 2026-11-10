"use client";

import { useEffect, type RefObject } from "react";
import { fitDisc, heightShortfall, largestFreeRect } from "./fit";
import type { Rect } from "./LabelLayer";
import type { TurntableScene } from "./scene";

const OCCLUDER = "[data-tt-occluder]";
const STAGE = "[data-tt-stage]";
/** Smaller than this it's visually hidden, not a panel (the phone's Search until it's used). */
const MIN_PANEL_PX = 4;

/** The panels over the stage, as rectangles inside it. Panels that aren't laid out don't count. `within`: only the stage's own. */
function occluderRects(stage: DOMRect, within?: Element): Rect[] {
  const rects: Rect[] = [];
  for (const el of (within ?? document).querySelectorAll(OCCLUDER)) {
    const r = el.getBoundingClientRect();
    if (r.width > MIN_PANEL_PX && r.height > MIN_PANEL_PX) rects.push({ x: r.left - stage.left, y: r.top - stage.top, w: r.width, h: r.height });
  }
  return rects;
}

/**
 * Keeps the globe in the largest space the panels leave free: re-measures on resize, when a panel
 * appears, goes or changes size, and when a drawer finishes sliding in (a transform fires no resize).
 * When the stage's own panels leave less than a readable globe (a 320 px screen, 200–400% zoom), the
 * stage grows by the shortfall (--tt-need) and the page scrolls. Drawers and sheets over it don't count.
 */
export function useOccluderFit(scene: TurntableScene | null, hostRef: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const host = hostRef.current;
    if (!scene || !host) return;
    let frame = 0;
    let last = "";
    const section = host.closest<HTMLElement>(STAGE);
    let grown = false;

    const measure = () => {
      frame = 0;
      const stage = host.getBoundingClientRect();
      if (section) {
        const short = heightShortfall(largestFreeRect(stage.width, stage.height, occluderRects(stage, section)));
        if (short > 0.5 || grown) {
          const need = Math.max(0, Math.round(stage.height + short));
          section.style.setProperty("--tt-need", `${need}px`);
          grown = need > 0;
        }
      }
      const fit = fitDisc(largestFreeRect(stage.width, stage.height, occluderRects(stage)));
      const key = `${stage.width}|${stage.height}|${Math.round(fit.cx)}|${Math.round(fit.cy)}|${Math.round(fit.radius)}`;
      if (key === last) return;
      last = key;
      scene.setFit(fit, stage.width, stage.height);
    };
    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(measure);
    };

    const sizes = new ResizeObserver(schedule);
    const observeAll = () => {
      sizes.disconnect();
      sizes.observe(host);
      for (const el of document.querySelectorAll(OCCLUDER)) sizes.observe(el);
    };
    const changes = new MutationObserver(() => {
      observeAll();
      schedule();
    });
    changes.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["data-tt-occluder", "hidden"] });
    document.addEventListener("transitionend", schedule, true);
    document.addEventListener("animationend", schedule, true);
    observeAll();
    schedule();

    return () => {
      cancelAnimationFrame(frame);
      sizes.disconnect();
      changes.disconnect();
      document.removeEventListener("transitionend", schedule, true);
      document.removeEventListener("animationend", schedule, true);
    };
  }, [scene, hostRef]);
}
