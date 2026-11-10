// The journey's timeline, on the Web Animations API, so one call can jump every part to the end. Transform and opacity only.

import { EASE_MECHANICAL } from "@/lib/motion";

export const GROW_MS = 500;
const OPEN_MS = 400;
const ARCH_MOVE_MS = 300;
const ARCH_FADE_MS = 100;
const MARQUEE_FADE_MS = 200;
const COIN_DROP_MS = 300;
const COIN_FADE_MS = 60;
const COIN_START_PX = -96;
export const REDUCED_MS = 150;

const EASE = `cubic-bezier(${EASE_MECHANICAL.join(",")})`;
const fadeOut = (el: Element, delay: number, duration: number) => el.animate({ opacity: [1, 0] }, { delay, duration, fill: "both" });

export interface JourneyParts {
  stage: HTMLElement;
  sky: HTMLElement;
  left: HTMLElement;
  right: HTMLElement;
  arch: HTMLElement;
}

/** Every moving part: returns the animations, all ending at or before 900 ms. */
export function animateJourney({ stage, sky, left, right, arch }: JourneyParts, from: DOMRect, crown: DOMRect | null): Animation[] {
  // Measured before anything moves: the grow below changes every box.
  const box = stage.getBoundingClientRect();
  const archBox = arch.getBoundingClientRect();
  const cap = arch.querySelector("[data-cap]")?.getBoundingClientRect();
  const scale = from.width / box.width;
  const list = [
    stage.animate({ transform: [`translate(${from.left - box.left}px, ${from.top - box.top}px) scale(${scale})`, "none"] }, { duration: GROW_MS, easing: EASE, fill: "both" }),
    fadeOut(sky, GROW_MS, OPEN_MS),
    left.animate({ transform: ["none", `translateX(${-window.innerWidth}px)`] }, { delay: GROW_MS, duration: OPEN_MS, easing: EASE, fill: "both" }),
    right.animate({ transform: ["none", `translateX(${window.innerWidth}px)`] }, { delay: GROW_MS, duration: OPEN_MS, easing: EASE, fill: "both" }),
  ];

  const coin = arch.querySelector("[data-coin]");
  if (coin) {
    list.push(coin.animate({ transform: [`translate(-50%, ${COIN_START_PX}px)`, "translate(-50%, 0)"] }, { duration: COIN_DROP_MS, easing: "ease-in", fill: "both" }));
    list.push(fadeOut(coin, COIN_DROP_MS, COIN_FADE_MS));
  }
  const marquee = arch.querySelector("[data-marquee]");
  if (marquee) list.push(fadeOut(marquee, GROW_MS, MARQUEE_FADE_MS));

  if (cap && crown && crown.width > 0) {
    const scaleX = crown.width / cap.width;
    const scaleY = crown.height / cap.height;
    const x = crown.left - archBox.left - (cap.left - archBox.left) * scaleX;
    const y = crown.top - archBox.top - (cap.top - archBox.top) * scaleY;
    arch.style.transformOrigin = "0 0";
    list.push(arch.animate({ transform: ["none", `translate(${x}px, ${y}px) scale(${scaleX}, ${scaleY})`] }, { delay: GROW_MS, duration: ARCH_MOVE_MS, easing: EASE, fill: "both" }));
    list.push(fadeOut(arch, GROW_MS + ARCH_MOVE_MS, ARCH_FADE_MS));
  } else {
    // No crown to land on (a short window folds it away): the arch leaves with the rest.
    list.push(fadeOut(arch, GROW_MS, OPEN_MS));
  }
  return list;
}
