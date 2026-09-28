// Shared motion values (docs/L3/REDESIGN.md §1): one feel across the app.
// Only transform and opacity move; everything follows "Reduce motion"
// (MotionConfig in AppShell, and the CSS rule in globals.css).

import type { Transition, Variants } from "motion/react";

/** Entrances: quick to start, soft to land. */
export const EASE_OUT_SOFT = [0.22, 1, 0.36, 1] as const;

export const SPRING = {
  /** Controls and panels: settles fast, no wobble. */
  snappy: { type: "spring", stiffness: 520, damping: 38, mass: 0.8 },
  /** Larger surfaces (drawers, the tuning needle): a little weight. */
  gentle: { type: "spring", stiffness: 260, damping: 30 },
} as const satisfies Record<string, Transition>;

/** A group whose children rise in one after another. */
export const STAGGER: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

/** One child of STAGGER: rises 14 px out of a slight blur. */
export const RISE: Variants = {
  hidden: { opacity: 0, y: 14, filter: "blur(4px)" },
  shown: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.5, ease: EASE_OUT_SOFT } },
};

/** Panels over the map: slide in from their edge. */
export const FROM_RIGHT: Variants = {
  hidden: { opacity: 0, x: 24 },
  shown: { opacity: 1, x: 0, transition: SPRING.gentle },
};

export const FROM_LEFT: Variants = {
  hidden: { opacity: 0, x: -24 },
  shown: { opacity: 1, x: 0, transition: SPRING.gentle },
};
