// Shared motion values (docs/L3/REDESIGN.md §1): one feel across the app.
// Only transform and opacity move; everything follows "Reduce motion"
// (MotionConfig in AppShell, and the CSS rule in globals.css).

import type { Transition, Variants } from "motion/react";

/** Entrances: quick to start, soft to land. */
export const EASE_OUT_SOFT = [0.22, 1, 0.36, 1] as const;

/** The same values as the CSS tokens in globals.css, in seconds, for motion/react. */
export const DURATION = { press: 0.08, flip: 0.28, land: 0.36, scene: 0.6 } as const;
/** A quick, firm stop: the jukebox's mechanical feel. */
export const EASE_MECHANICAL = [0.2, 0.9, 0.1, 1] as const;
/** Landing only. */
export const EASE_SETTLE = [0.34, 1.4, 0.64, 1] as const;

export const SPRING = {
  /** Controls and panels: settles fast, no wobble. */
  snappy: { type: "spring", stiffness: 520, damping: 38, mass: 0.8 },
  /** Larger surfaces (drawers, the tuning needle): a little weight. */
  gentle: { type: "spring", stiffness: 260, damping: 30 },
} as const satisfies Record<string, Transition>;

/** Panels over the map: slide in from their edge. */
export const FROM_RIGHT: Variants = {
  hidden: { opacity: 0, x: 24 },
  shown: { opacity: 1, x: 0, transition: SPRING.gentle },
};

export const FROM_LEFT: Variants = {
  hidden: { opacity: 0, x: -24 },
  shown: { opacity: 1, x: 0, transition: SPRING.gentle },
};
