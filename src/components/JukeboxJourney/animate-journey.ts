// The journey's timeline, on the Web Animations API, so one call can jump every part to the end. Transform and opacity only.

import { EASE_MECHANICAL } from "@/lib/motion";
import { VIEW_H, VIEW_W } from "../JukeboxArt/parts";

export const GROW_MS = 500;
const OPEN_MS = 400;
const ARCH_MOVE_MS = 300;
const ARCH_FADE_MS = 100;
const MARQUEE_FADE_MS = 200;
const COIN_DROP_MS = 300;
const COIN_FADE_MS = 60;
const COIN_START_Y = -70;
export const REDUCED_MS = 150;

const EASE = `cubic-bezier(${EASE_MECHANICAL.join(",")})`;

/** The arch's box in the drawing, measured to the middle of its stroke, so both its edges land within 2 px of the crown. */
const ARCH_BOX = { x: 38.95, y: 19.25, width: 362.1, height: 131.5 } as const;

export interface Fit {
  left: number;
  top: number;
  width: number;
  height: number;
  /** Pixels per drawing unit. */
  unit: number;
}

/** The whole jukebox, as large as the screen allows, centred. */
export function fitToScreen(): Fit {
  const unit = Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H);
  const width = VIEW_W * unit;
  const height = VIEW_H * unit;
  return { left: (window.innerWidth - width) / 2, top: (window.innerHeight - height) / 2, width, height, unit };
}

const fadeOut = (el: Element, delay: number, duration: number) => el.animate({ opacity: [1, 0] }, { delay, duration, fill: "both" });

/** Every moving part: returns the animations, all ending at or before 900 ms. */
export function animateJourney(art: HTMLElement, sky: HTMLElement, from: DOMRect, fit: Fit, crown: DOMRect | null): Animation[] {
  const scale = from.width / fit.width;
  const list = [
    art.animate({ transform: [`translate(${from.left - fit.left}px, ${from.top - fit.top}px) scale(${scale})`, "none"] }, { duration: GROW_MS, easing: EASE, fill: "both" }),
    fadeOut(sky, GROW_MS, OPEN_MS),
  ];

  const part = (selector: string) => art.querySelector<SVGElement>(selector);
  const inDrawing = (el: SVGElement) => {
    el.style.transformBox = "view-box";
    el.style.transformOrigin = "0 0";
    return el;
  };

  const coin = part("[data-coin]");
  if (coin) {
    list.push(inDrawing(coin).animate({ transform: [`translateY(${COIN_START_Y}px)`, "none"] }, { duration: COIN_DROP_MS, easing: "ease-in", fill: "both" }));
    list.push(fadeOut(coin, COIN_DROP_MS, COIN_FADE_MS));
  }

  const body = part("[data-body]");
  if (body) list.push(fadeOut(body, GROW_MS, OPEN_MS));

  // Far enough to clear the screen, in drawing units.
  const away = window.innerWidth / fit.unit;
  for (const [side, sign] of [["left", -1], ["right", 1]] as const) {
    const door = part(`[data-door="${side}"]`);
    if (door) list.push(inDrawing(door).animate({ transform: ["none", `translateX(${sign * away}px)`] }, { delay: GROW_MS, duration: OPEN_MS, easing: EASE, fill: "both" }));
  }

  const marquee = part("[data-marquee]");
  if (marquee) list.push(fadeOut(marquee, GROW_MS, MARQUEE_FADE_MS));

  const arch = part("[data-arch]");
  if (arch && crown) {
    const scaleX = crown.width / fit.unit / ARCH_BOX.width;
    const scaleY = crown.height / fit.unit / ARCH_BOX.height;
    const x = (crown.left - fit.left) / fit.unit - ARCH_BOX.x * scaleX;
    const y = (crown.top - fit.top) / fit.unit - ARCH_BOX.y * scaleY;
    list.push(inDrawing(arch).animate({ transform: ["none", `translate(${x}px, ${y}px) scale(${scaleX}, ${scaleY})`] }, { delay: GROW_MS, duration: ARCH_MOVE_MS, easing: EASE, fill: "both" }));
    list.push(fadeOut(arch, GROW_MS + ARCH_MOVE_MS, ARCH_FADE_MS));
  } else if (arch) {
    list.push(fadeOut(arch, GROW_MS, OPEN_MS));
  }
  return list;
}
