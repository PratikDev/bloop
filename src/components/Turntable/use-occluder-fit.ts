"use client";

import { useEffect, type RefObject } from "react";
import { MEDIA } from "@/lib/breakpoints";
import { layoutPair, pairGrowth, type PairMode } from "./fit";
import type { Rect } from "./LabelLayer";
import type { TurntableScene } from "./scene";

const OCCLUDER = "[data-tt-occluder]";
const STAGE = "[data-tt-stage]";
/** The turntable's canvas host inside the stage: placed beside (or under) the globe by the layout. */
const DECK_HOST = "[data-deck-host]";
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
 * Keeps the globe and the turntable beside it in the largest space the panels leave free: re-measures on resize, when a panel
 * appears, goes or changes size, and when a drawer finishes sliding in (a transform fires no resize).
 * When the stage's own panels leave less than a readable globe (a 320 px screen, 200–400% zoom), the
 * stage grows (--tt-need) and the page scrolls. It is measured at its usual height each time, so it shrinks back
 * when a panel closes. Drawers and sheets over it don't count. All within one frame: nothing is painted between.
 */
export function useOccluderFit(scene: TurntableScene | null, hostRef: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const host = hostRef.current;
    if (!scene || !host) return;
    let frame = 0;
    let last = "";
    const section = host.closest<HTMLElement>(STAGE);

    const deckHost = section?.querySelector<HTMLElement>(DECK_HOST) ?? null;
    const modeNow = (): PairMode => (window.matchMedia(MEDIA.mapOverlay).matches ? "side" : "stacked");

    const grow = () => {
      if (!section) return;
      section.style.removeProperty("--tt-need");
      const usual = host.getBoundingClientRect();
      const extra = pairGrowth(usual.width, usual.height, occluderRects(usual, section), modeNow());
      if (extra > 0) section.style.setProperty("--tt-need", `${Math.round(usual.height + extra)}px`);
    };

    const measure = () => {
      frame = 0;
      grow();
      const stage = host.getBoundingClientRect();
      const { globe: fit, deck } = layoutPair(stage.width, stage.height, occluderRects(stage), modeNow());
      const key = `${stage.width}|${stage.height}|${Math.round(fit.cx)}|${Math.round(fit.cy)}|${Math.round(fit.radius)}|${Math.round(deck.x)}|${Math.round(deck.y)}|${Math.round(deck.w)}`;
      if (key === last) return;
      last = key;
      scene.setFit(fit, stage.width, stage.height);
      // Moved by transform, so it eases with the globe's own fit (a short transition; none under reduced motion).
      if (deckHost) Object.assign(deckHost.style, { transform: `translate(${deck.x}px, ${deck.y}px)`, width: `${deck.w}px`, height: `${deck.h}px` });
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
